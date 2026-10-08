"""AI API contract tests with synthetic responses; no external requests or credits."""
import copy
import io
import json
import shutil
import unittest
from unittest.mock import patch
import urllib.error
import animation_api as api


class ProviderConfigTests(unittest.TestCase):
    def test_glm_default_and_explicit_provider_selection(self):
        cases = [({}, 'glm', 'glm-5.3'),
                 ({'OPENAI_API_KEY': 'test-key'}, 'openai', 'gpt-4.1'),
                 ({'OPENAI_API_KEY': 'test-key', 'GLM_API_KEY': 'test-key'}, 'glm', 'glm-5.3'),
                 ({'AI_PROVIDER': 'openai', 'GLM_API_KEY': 'test-key'}, 'openai', 'gpt-4.1'),
                 ({'ANTHROPIC_API_KEY': 'test-key'}, 'anthropic', 'claude-sonnet-5-5'),
                 ({'AI_PROVIDER': 'anthropic', 'ANTHROPIC_MODEL': 'claude-opus-5-5'}, 'anthropic', 'claude-opus-5-5'),
                 ({'AI_PROVIDER': 'invalid', 'OPENAI_API_KEY': 'test-key'}, 'openai', 'gpt-4.1'),
                 ({'GEMINI_API_KEY': 'test-key'}, 'gemini', api.kare_env.DEFAULTS['GEMINI_MODEL']),
                 ({'GEMINI_API_KEY': 'test-key', 'ANTHROPIC_API_KEY': 'test-key'}, 'anthropic', 'claude-sonnet-5-5'),
                 ({'AI_PROVIDER': 'gemini', 'GEMINI_MODEL': 'gemini-2.5-pro'}, 'gemini', 'gemini-2.5-pro')]
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

    def test_skill_prompt_includes_guide_and_examples_within_budget(self):
        for category in api.IDS:
            with self.subTest(category=category):
                text = api.skill_prompt(category)
                self.assertNotIn('\nname: canvas-', text[:200])            # frontmatter çıkarıldı
                self.assertIn('canvas-' + category, text)
                self.assertGreaterEqual(text.count('```json'), 2)
                self.assertIn('## Sık hatalar', text)
                self.assertLessEqual(len(text), api.SKILL_PROMPT_CHARS)
        self.assertLessEqual(len(api.ART_DIRECTOR), 4000)

    def test_skill_prompt_truncates_at_section_boundary(self):
        text = api.skill_prompt('watercolor', limit=3000)
        self.assertLessEqual(len(text), 3100)
        self.assertIn('kısaltıldı', text)
        self.assertNotIn('```json', text)

    def test_generate_prompt_has_art_director_and_examples(self):
        response = dict(status='completed', output=[dict(content=[dict(type='output_text', text=json.dumps(self.scene()))])])
        with patch.object(api, 'config', return_value=('test-key', 'test-model')), \
                patch.object(api.urllib.request, 'urlopen', return_value=io.BytesIO(json.dumps(response).encode())) as call:
            api.generate(dict(category='watercolor', prompt='Çiçeklerin dansı'))
            instructions = json.loads(call.call_args.args[0].data)['instructions']
        self.assertIn('ART DIRECTOR RULES', instructions)
        self.assertIn('Örnek 2', instructions)
        self.assertIn('"category":"watercolor"', instructions)
        self.assertLess(len(instructions), api.SKILL_PROMPT_CHARS + 8000)

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

    def test_anthropic_messages_protocol(self):
        response = {'type': 'message', 'stop_reason': 'end_turn', 'content': [{'type': 'text', 'text': '```json\n{"ok": true}\n```'}],
                    'usage': {'input_tokens': 5, 'output_tokens': 3}}
        with patch.object(api, 'provider', return_value='anthropic'), patch.object(api, 'config', return_value=('private-test-key', 'claude-sonnet-5-5')):
            with patch.object(api.urllib.request, 'urlopen', return_value=io.BytesIO(json.dumps(response).encode())) as call:
                result, info = api.call_json('Return JSON only', 'Test', max_tokens=100000)
                request = call.call_args.args[0]
                self.assertEqual(request.full_url, 'https://api.anthropic.com/v1/messages')
                headers = {k.lower(): v for k, v in request.header_items()}
                self.assertEqual(headers['x-api-key'], 'private-test-key')
                self.assertEqual(headers['anthropic-version'], '2023-06-01')
                self.assertNotIn('authorization', headers)
                payload = json.loads(request.data)
                self.assertEqual(payload['model'], 'claude-sonnet-5-5')
                self.assertLessEqual(payload['max_tokens'], 32000)
                self.assertEqual(payload['messages'], [{'role': 'user', 'content': 'Test'}])
                self.assertIn('JSON', payload['system'])
                self.assertTrue(result['ok']); self.assertEqual(info['provider'], 'anthropic')
                self.assertNotIn('private-test-key', json.dumps(info))

    def test_anthropic_incomplete_or_refused(self):
        for stop in ('max_tokens', 'refusal'):
            response = {'stop_reason': stop, 'content': [{'type': 'text', 'text': '{"ok"'}]}
            with self.subTest(stop=stop), patch.object(api, 'provider', return_value='anthropic'), \
                    patch.object(api, 'config', return_value=('k', 'claude-sonnet-5-5')), \
                    patch.object(api.urllib.request, 'urlopen', return_value=io.BytesIO(json.dumps(response).encode())):
                with self.assertRaises(api.ModelError):
                    api.call_json('Return JSON only', 'Test')


@unittest.skipUnless(shutil.which('node'), 'node gerekli')
class SkillExampleTests(unittest.TestCase):
    def test_all_skill_examples_are_valid(self):
        import check_skill_examples as checker
        skills, examples, problems = checker.collect()
        problems += checker.engine_check(examples)
        self.assertEqual(len(skills), 20)
        self.assertEqual(len(examples), 40)
        self.assertEqual(problems, [])


class GeminiProtocolTests(unittest.TestCase):
    KEY = 'private-gemini-test-key'

    def call(self, response, **kwargs):
        with patch.object(api, 'provider', return_value='gemini'), patch.object(api, 'config', return_value=(self.KEY, 'gemini-3.8-flash')), \
                patch.object(api.urllib.request, 'urlopen', return_value=io.BytesIO(json.dumps(response).encode())) as call:
            result = api.call_json('Return JSON only', 'Test', **kwargs)
            return result, call.call_args.args[0]

    def test_request_shape_and_parsing(self):
        response = {'candidates': [{'finishReason': 'STOP', 'content': {'role': 'model', 'parts': [{'text': '{"ok": true}'}]}}],
                    'usageMetadata': {'promptTokenCount': 4, 'candidatesTokenCount': 3}}
        (result, info), request = self.call(response, schema=None, max_tokens=100000)
        self.assertEqual(request.full_url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent')
        self.assertNotIn(self.KEY, request.full_url); self.assertNotIn('key=', request.full_url)
        headers = {k.lower(): v for k, v in request.header_items()}
        self.assertEqual(headers['x-goog-api-key'], self.KEY); self.assertNotIn('authorization', headers)
        payload = json.loads(request.data)
        self.assertNotIn(self.KEY, json.dumps(payload))
        self.assertEqual(payload['generationConfig']['responseMimeType'], 'application/json')
        self.assertLessEqual(payload['generationConfig']['maxOutputTokens'], 65536)
        self.assertEqual(payload['contents'], [{'role': 'user', 'parts': [{'text': 'Test'}]}])
        self.assertIn('Return JSON only', payload['systemInstruction']['parts'][0]['text'])
        self.assertTrue(result['ok']); self.assertEqual(info['provider'], 'gemini')
        self.assertEqual(info['usage']['promptTokenCount'], 4); self.assertNotIn(self.KEY, json.dumps(info))

    def test_thought_parts_are_ignored(self):
        response = {'candidates': [{'finishReason': 'STOP', 'content': {'parts': [{'text': 'thinking…', 'thought': True}, {'text': '{"ok": 1}'}]}}]}
        (result, _), _ = self.call(response)
        self.assertEqual(result, {'ok': 1})

    def test_blocked_or_incomplete(self):
        for response in ({'promptFeedback': {'blockReason': 'SAFETY'}},
                         {'candidates': [{'finishReason': 'MAX_TOKENS', 'content': {'parts': [{'text': '{"ok"'}]}}]},
                         {'candidates': [{'finishReason': 'SAFETY'}]}):
            with self.subTest(response=response), self.assertRaises(api.ModelError):
                self.call(response)

    def test_generate_scene_through_gemini(self):
        scene = SceneApiTests.scene(None)
        response = {'candidates': [{'finishReason': 'STOP', 'content': {'parts': [{'text': json.dumps(scene)}]}}]}
        with patch.object(api, 'provider', return_value='gemini'), patch.object(api, 'config', return_value=(self.KEY, 'gemini-3.8-flash')), \
                patch.object(api.urllib.request, 'urlopen', return_value=io.BytesIO(json.dumps(response).encode())) as call:
            code, body = api.generate(dict(category='watercolor', prompt='Suluboya bir çiçek çiz'))
            payload = json.loads(call.call_args.args[0].data)
        self.assertEqual(code, 200, body); self.assertTrue(body['scene']['composed'])
        self.assertIn('canvas-watercolor', payload['systemInstruction']['parts'][0]['text'])

    def test_bad_model_id_is_not_sent(self):
        with patch.object(api, 'provider', return_value='gemini'), patch.object(api, 'config', return_value=(self.KEY, 'x/../y')), \
                patch.object(api.urllib.request, 'urlopen') as call:
            with self.assertRaises(api.ModelError):
                api.call_json('Return JSON only', 'Test')
            call.assert_not_called()


if __name__ == '__main__':
    unittest.main()
