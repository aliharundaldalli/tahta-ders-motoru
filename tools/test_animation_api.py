"""AI API contract tests with synthetic responses; no external requests or credits."""
import copy
import io
import json
import unittest
from unittest.mock import patch
import urllib.error
import animation_api as api


class ProviderConfigTests(unittest.TestCase):
    def test_glm_default_and_explicit_provider_selection(self):
        cases = [({}, 'glm', 'glm-5.3'),
                 ({'OPENAI_API_KEY': 'test-key'}, 'openai', 'gpt-4.1'),
                 ({'OPENAI_API_KEY': 'test-key', 'GLM_API_KEY': 'test-key'}, 'glm', 'glm-5.3'),
                 ({'AI_PROVIDER': 'openai', 'GLM_API_KEY': 'test-key'}, 'openai', 'gpt-4.1')]
        for settings, provider, model in cases:
            with self.subTest(provider=provider, settings=list(settings)), patch.object(api, 'settings', return_value=settings):
                self.assertEqual(api.provider(), provider)
                self.assertEqual(api.config()[1], model)


class SceneApiTests(unittest.TestCase):
    def setUp(self):
        provider = patch.object(api, 'provider', return_value='openai')
        provider.start(); self.addCleanup(provider.stop)

    def scene(self):
        return dict(category='watercolor', title='Suluboya çiçek', duration=12, seed=42,
                    speed=1, detail=1, background='#f0ece0', palette=['#aabbcc', '#aaccbb'],
                    objects=[dict(type='path', x=.5, y=.5, width=.2, height=.2,
                                  color='#667788', lineWidth=2, start=1, duration=4,
                                  text='', points=[[.4,.4],[.5,.3],[.6,.4]], motion='draw')])

    def generate(self, scene):
        response = dict(status='completed', output=[dict(content=[dict(type='output_text', text=json.dumps(scene))])])
        with patch.object(api, 'config', return_value=('test-key', 'test-model')):
            with patch.object(api.urllib.request, 'urlopen', return_value=io.BytesIO(json.dumps(response).encode())) as call:
                result = api.generate(dict(category='watercolor', prompt='Suluboya bir çiçek çiz'))
                payload = json.loads(call.call_args.args[0].data)
                self.assertIn('canvas-watercolor', payload['instructions'])
                self.assertTrue(payload['text']['format']['strict'])
                return result

    def test_valid_scene_and_skill_injection(self):
        code, body = self.generate(self.scene())
        self.assertEqual(code, 200)
        self.assertEqual(body['scene']['objects'][0]['motion'], 'draw')
        self.assertIn('id', body['scene'])

    def test_invalid_results_are_not_applied(self):
        changes = [('duration', -1), ('palette', ['javascript:alert(1)', '#aabbcc']), ('category','ink')]
        for field, value in changes:
            scene = self.scene(); scene[field] = value
            with self.subTest(field=field):
                code, body = self.generate(scene)
                self.assertEqual(code, 502)
                self.assertNotIn('scene', body)
        scene = self.scene(); scene['objects'][0]['start'] = 15
        self.assertEqual(self.generate(scene)[0], 502)

    def test_no_key(self):
        with patch.object(api, 'config', return_value=('', 'test-model')):
            self.assertEqual(api.generate(dict(category='watercolor',prompt='A flower'))[0], 503)

    def test_service_error_redacts_key(self):
        with patch.object(api, 'config', return_value=('never-print-this', 'test-model')):
            with patch.object(api.urllib.request, 'urlopen', side_effect=urllib.error.HTTPError('url',429,'limit',{},None)):
                code, body = api.generate(dict(category='watercolor',prompt='A flower'))
                self.assertEqual(code, 502)
                self.assertNotIn('never-print-this', json.dumps(body))

    def test_all_twenty_skills(self):
        self.assertEqual(len(api.CATALOG), 20)
        for category in api.IDS:
            self.assertIn('name: canvas-' + category, api.skill(category))

    def test_glm_chat_protocol(self):
        response = {'choices': [{'finish_reason': 'stop', 'message': {'content': '{"ok":true}'}}], 'usage': {'total_tokens': 12}}
        with patch.object(api, 'provider', return_value='glm'), patch.object(api, 'config', return_value=('private-test-key', 'glm-5.3')):
            with patch.object(api.urllib.request, 'urlopen', return_value=io.BytesIO(json.dumps(response).encode())) as call:
                result, info = api.call_json('Return JSON only', 'Test')
                request = call.call_args.args[0]
                self.assertEqual(request.full_url, 'https://api.z.ai/api/coding/paas/v4/chat/completions')
                payload = json.loads(request.data)
                self.assertEqual(payload['model'], 'glm-5.3')
                self.assertEqual(payload['thinking']['type'], 'enabled')
                self.assertEqual(payload['response_format']['type'], 'json_object')
                self.assertTrue(result['ok'])
                self.assertNotIn('private-test-key', json.dumps(info))


if __name__ == '__main__':
    unittest.main()
