"""Ses → sahne eşzamanlaması: süre uydurma, ipucu eşleme, hizalama yedeği, AI cue alanı (Whisper/API çağrısı yok)."""
import copy
import tempfile
import unittest
import uuid
import wave
from pathlib import Path
from unittest.mock import patch
import animation_api as ai
import production_api as production
import speech_sync as sync


def obj(**kw):
    base = {'type': 'circle', 'x': .5, 'y': .5, 'width': .1, 'height': .1, 'color': '#f2b440', 'lineWidth': 1,
            'start': 0, 'duration': 1, 'text': '', 'points': [], 'motion': 'fade'}
    return base | kw


def scene(duration=30, objects=(), narration='Bir üçgen çizelim.'):
    return {'id': str(uuid.uuid4()), 'category': 'line-art', 'title': 'Sahne', 'duration': duration, 'seed': 1, 'speed': 1,
            'detail': 1, 'background': '#1d2420', 'palette': ['#f1ead8', '#f2b440'], 'objects': list(objects),
            'composed': True, 'narration': narration}


def fake_transcribe(words):
    """Whisper yerine: verilen (kelime, başlangıç, bitiş) listesini mlx biçiminde döndürür."""
    def run(*args, **kwargs):
        return {'segments': [{'words': [{'word': ' ' + w, 'start': s, 'end': e} for w, s, e in words]}]}
    return run


class FitTests(unittest.TestCase):
    def test_shorter_audio_shrinks_scene_and_rescales(self):
        s = scene(30, [obj(start=15, duration=4, keyframes=[{'time': 20, 'x': .3}]), obj(start=29.5, duration=3)])
        self.assertEqual(sync.fit_scene_to_audio(s, 18.8), 19.4)
        a, b = s['objects']
        self.assertAlmostEqual(a['start'], 15 * 19.4 / 30, places=3)
        self.assertAlmostEqual(a['duration'], 4 * 19.4 / 30, places=3)
        self.assertAlmostEqual(a['keyframes'][0]['time'], 20 * 19.4 / 30, places=3)
        self.assertLessEqual(b['start'], 19.3); self.assertLessEqual(b['start'] + b['duration'], 19.4 + 1e-9)

    def test_longer_audio_extends_scene(self):
        s = scene(10, [obj(start=5, duration=2, keyframes=[{'time': 9.9}])])
        self.assertEqual(sync.fit_scene_to_audio(s, 20), 20.6)
        self.assertAlmostEqual(s['objects'][0]['start'], 10.3, places=3)
        self.assertAlmostEqual(s['objects'][0]['keyframes'][0]['time'], 9.9 * 2.06, places=3)

    def test_limits(self):
        self.assertEqual(sync.fit_scene_to_audio(scene(10), .3), 2)
        self.assertEqual(sync.fit_scene_to_audio(scene(10), 119.8), 120)


class CueTests(unittest.TestCase):
    def tokens(self, text):
        return [sync.norm(w) for w in text.split()]

    def test_turkish_normalization(self):
        self.assertEqual(sync.norm("Pisagor'un"), 'pisagor')
        self.assertEqual(sync.norm('IŞIK'), 'ışık')
        self.assertEqual(sync.norm('İkizkenar,'), 'ikizkenar')

    def test_suffix_and_prefix_match(self):
        t = self.tokens("Şimdi Pisagor'un teoremini hatırlayalım: dik üçgenin hipotenüsü en uzun kenardır.")
        self.assertEqual(sync.find_cue('Pisagor teoremi', t), 1)       # ifade: ek ve kesme işareti
        self.assertEqual(sync.find_cue('Üçgen', t), 5)                  # önek eşleşmesi ≥4 harf
        self.assertEqual(sync.find_cue('Hipotenüs', t), 6)
        self.assertIsNone(sync.find_cue('kare', t))
        self.assertIsNone(sync.find_cue('ve en', t))                    # bağlaç/kısa kelime tek başına eşleşmez
        self.assertIsNone(sync.find_cue('dik', self.tokens('dikdörtgen')))  # <4 harf önek sayılmaz

    def test_retime_prefers_cue_text_and_staggers(self):
        words = [{'w': w, 'start': i * 1.0, 'end': i * 1.0 + .8} for i, w in enumerate('Önce bir daire sonra üçgen çizelim'.split())]
        s = scene(8, [obj(start=0, duration=1),                                  # arka plan: eşleşmez
                      obj(start=6, duration=1, cueText='üçgen'),               # 4. kelime
                      obj(type='text', text='Daire', start=7, duration=3),      # 2. kelime
                      obj(start=7, duration=1, cueText='daire'),                # aynı kelime → kademeli
                      obj(start=5, duration=1, cueText='üçgen', locked=True)])  # kilitli: dokunulmaz
        plan = sync.retime_objects(s, words)
        o = s['objects']
        self.assertEqual(o[0]['start'], 0)
        self.assertAlmostEqual(o[1]['start'], 3.8)
        self.assertAlmostEqual(o[2]['start'], 1.8); self.assertAlmostEqual(o[2]['duration'], 3)
        self.assertAlmostEqual(o[3]['start'], 1.95)                             # 0,15 sn kaydırma
        self.assertEqual(o[4]['start'], 5)
        self.assertEqual(len(plan), 3)

    def test_retime_clamps_to_scene(self):
        words = [{'w': 'son', 'start': 0, 'end': .1}, {'w': 'yıldız', 'start': 4.9, 'end': 5}]
        s = scene(5, [obj(start=0, duration=3, cueText='yıldız', keyframes=[{'time': 1}])])
        sync.retime_objects(s, words)
        o = s['objects'][0]
        self.assertAlmostEqual(o['start'], 4.7); self.assertAlmostEqual(o['duration'], .3)
        self.assertAlmostEqual(o['keyframes'][0]['time'], 5)


class AlignTests(unittest.TestCase):
    def test_alignment_and_retime(self):
        s = scene(30, [obj(start=20, duration=2, cueText='üçgen')], 'Bir üçgen çizelim.')
        run = fake_transcribe([('Bir', .1, .3), ('üçgen', .4, .9), ('çizelim', 1.0, 1.5)])
        info = sync.sync_scene(s, 'x.wav', 1.6, transcribe=run)
        self.assertEqual(s['duration'], 2.2)
        self.assertTrue(info['aligned']); self.assertEqual((info['matched'], info['total'], info['cues']), (3, 3, 1))
        self.assertEqual([w['w'] for w in s['words']], ['Bir', 'üçgen', 'çizelim.'])
        self.assertEqual(s['alignment'], 'Whisper 3/3')
        self.assertAlmostEqual(s['objects'][0]['start'], .2)

    def test_whisper_failure_keeps_fit(self):
        def broken(*a, **k): raise ImportError('mlx_whisper yok')
        s = scene(30, [obj(start=15, duration=2, cueText='üçgen')])
        info = sync.sync_scene(s, 'x.wav', 9.4, transcribe=broken)
        self.assertFalse(info['aligned']); self.assertEqual(s['duration'], 10)
        self.assertAlmostEqual(s['objects'][0]['start'], 5); self.assertEqual(s['words'], [])

    def test_no_fit_only_extends(self):
        s = scene(30, [obj(start=15)])
        sync.sync_scene(s, 'x.wav', 10, fit=False, transcribe=fake_transcribe([]))
        self.assertEqual(s['duration'], 30); self.assertEqual(s['objects'][0]['start'], 15)


class VoiceJobTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(); self.addCleanup(temporary.cleanup)
        data = patch.object(production, 'DATA', Path(temporary.name)); data.start(); self.addCleanup(data.stop)

    def test_single_scene_voice_syncs_only_that_scene(self):
        scenes = [scene(30, [obj(start=10, duration=2, cueText='güneş')], 'Burada güneş doğuyor.') for _ in range(3)]
        project = production.validate_project({'version': 1, 'scenes': scenes})
        before = copy.deepcopy(project['scenes'])
        identifier = str(uuid.uuid4()); production.write(production.folder(identifier) / 'job.json', {'id': identifier, 'state': 'running'})
        def synthesize(job, args, **kwargs):
            with wave.open(args[-1], 'wb') as w:
                w.setnchannels(1); w.setsampwidth(2); w.setframerate(8000); w.writeframes(b'\x00\x00' * 8000 * 4)
        run = fake_transcribe([('Burada', .1, .5), ('güneş', .6, 1.1), ('doğuyor', 1.2, 2)])
        real = sync.align_words
        with patch.object(production, 'status', return_value={'voices': [{'id': 'cartesia', 'available': True}]}), \
             patch.object(production, 'run_process', side_effect=synthesize), \
             patch.object(production.speech_sync, 'align_words', side_effect=lambda p, n, d, t=None: real(p, n, d, run)):
            result = production.job_voice(identifier, {'project': project, 'provider': 'cartesia', 'sceneIndex': 1, 'sceneId': project['scenes'][1]['id']})
        out = result['project']['scenes']
        self.assertEqual(out[0], before[0]); self.assertEqual(out[2], before[2])
        self.assertEqual(out[1]['duration'], 4.6); self.assertTrue(result['aligned'])
        self.assertAlmostEqual(out[1]['objects'][0]['start'], .4)
        self.assertEqual(len(out[1]['words']), 3); self.assertEqual(result['scene'], out[1])


class AiCueTests(unittest.TestCase):
    def test_cue_schema_and_adopt(self):
        s = {'objects': [obj(cue='  güneş  doğuyor '), obj(cue=''), obj(cue='x' * 60)]}
        ai.normalize_scene(s)
        self.assertEqual(s['objects'][0]['cue'], 'güneş doğuyor'); self.assertNotIn('cue', s['objects'][1])
        self.assertLessEqual(len(s['objects'][2]['cue']), 40)
        item = ai.scene_schema(narration=True, cue=True)['properties']['objects']['items']
        self.assertEqual(item['properties']['cue']['maxLength'], 40)
        self.assertNotIn('cue', ai.scene_schema()['properties']['objects']['items']['properties'])
        with self.assertRaises(ValueError):
            ai.validate_schema(obj(cue='y' * 41), item)
        ai.adopt_cues(s)
        self.assertEqual(s['objects'][0]['cueText'], 'güneş doğuyor'); self.assertTrue(all('cue' not in o for o in s['objects']))


if __name__ == '__main__':
    unittest.main()
