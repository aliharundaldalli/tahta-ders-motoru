import copy,io,json,sys,tempfile,types,unittest,uuid,wave,zipfile
from pathlib import Path
from unittest.mock import patch
import production_api as production
import pro_api as pro
from test_production_api import scene

def obj(identifier='shape',locked=False):
    return dict(id=identifier,type='circle',x=.5,y=.4,width=.1,height=.1,color='#f1ead8',lineWidth=3,start=0,duration=1,motion='fade',text='',points=[],locked=locked)

class ProfessionalTests(unittest.TestCase):
    def setUp(self):
        temp=tempfile.TemporaryDirectory();self.addCleanup(temp.cleanup)
        mock=patch.object(production,'DATA',Path(temp.name));mock.start();self.addCleanup(mock.stop)
        self.identifier=str(uuid.uuid4());production.write(production.folder(self.identifier)/'job.json',{'state':'running'})
        s=scene();s['objects']=[obj('locked',True),obj('target')]
        self.project=production.validate_project({'version':1,'name':'Pro test','scenes':[s]})

    def test_math_verification_and_injection(self):
        self.assertTrue(pro.math_tool(dict(expression='x*x',other='x^2',action='equivalence'))['equivalent'])
        self.assertEqual(pro.math_tool(dict(expression='x^2',action='derivative'))['result'],'2*x')
        self.assertAlmostEqual(float(pro.math_tool(dict(expression='x^2',action='integral',**{'from':0,'to':1}))['result']),1/3)
        for text in ['__import__("os").system("whoami")','x^100000','x+','open("secret")','(100000^12)^12','((x+1)^12)^12']:
            with self.subTest(text=text),self.assertRaises(ValueError):pro.math_expression(text)
        with self.assertRaises(ValueError):pro.math_tool(dict(expression='sin(x)',action='integral'))

    def test_parameter_graph_changes_and_discontinuities(self):
        a=pro.math_tool(dict(expression='a*x^2',parameter=1));b=pro.math_tool(dict(expression='a*x^2',parameter=2))
        self.assertNotEqual(a['points'],b['points'])
        graph=pro.math_tool(dict(expression='1/x',**{'from':-1,'to':1}))
        self.assertIsNone(graph['points'][80])

    def test_revision_deduplicates_and_restores(self):
        first=pro.revision(self.project,production);second=pro.revision(self.project,production)
        self.assertEqual(first,second)
        self.project['name']='Changed';pro.revision(self.project,production)
        versions=pro.handle('versions',{'id':first['id']},production)['versions'];self.assertEqual(len(versions),2)
        saved=pro.handle('restore',first,production)['project'];self.assertEqual(saved['name'],'Pro test')

    def add_audio(self):
        dest=production.folder(self.identifier)/'take.wav'
        with wave.open(str(dest),'wb') as wav:wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(16000);wav.writeframes(bytes(32000))
        self.project['scenes'][0]['audio']={'url':f'/api/animation/assets/{self.identifier}/take.wav','duration':1,'provider':'test'}

    def test_package_audio_roundtrip_and_path_rejection(self):
        self.add_audio();export=pro.package(self.project,production);content=production.asset_path(export['url']).read_bytes()
        result=pro.import_package(content,production)['project']
        self.assertNotEqual(result['id'],self.project['id']);self.assertTrue(production.asset_path(result['scenes'][0]['audio']['url']).exists())
        with zipfile.ZipFile(io.BytesIO(content)) as z:p=json.loads(z.read('project.json'))
        p['scenes'][0]['audio']['url']='package:../../outside.wav';buf=io.BytesIO()
        with zipfile.ZipFile(buf,'w') as z:z.writestr('project.json',json.dumps(p))
        with self.assertRaises(ValueError):pro.import_package(buf.getvalue(),production)

    def test_targeted_patch_preserves_other_objects_and_metadata(self):
        before=copy.deepcopy(self.project);answer=scene();answer['objects']=[obj()];answer['objects'][0]['color']='#f2b440'
        with patch.object(pro.ai,'generate',return_value=(200,{'scene':answer})):
            result=pro.patch_project(self.identifier,dict(project=self.project,sceneIndex=0,objectId='target',prompt='Change to amber'),production)['project']
        self.assertEqual(result['scenes'][0]['objects'][0],before['scenes'][0]['objects'][0])
        self.assertEqual(result['scenes'][0]['objects'][1]['id'],'target');self.assertEqual(result['scenes'][0]['objects'][1]['color'],'#f2b440')
        with self.assertRaises(ValueError):pro.patch_project(self.identifier,dict(project=self.project,objectId='locked',prompt='Change this'),production)

    def test_scene_patch_preserves_locks_and_interval(self):
        answer=scene();answer['objects']=[obj()];self.project['scenes'][0]['objects'][1]['start']=20
        with patch.object(pro.ai,'generate',return_value=(200,{'scene':answer})):
            result=pro.patch_project(self.identifier,dict(project=self.project,scope='interval',**{'from':0,'to':10},prompt='Draw a circle'),production)['project']
        objs=result['scenes'][0]['objects'];self.assertEqual(objs[0]['id'],'locked');self.assertEqual(objs[1]['id'],'target');self.assertEqual(len({o['id'] for o in objs}),3)

    def test_alignment_reports_interpolation(self):
        self.add_audio();self.project['scenes'][0]['narration']='Bir iki üç dört'
        fake=types.SimpleNamespace(transcribe=lambda *args,**kwargs:{'segments':[{'words':[{'word':'Bir','start':0,'end':.2},{'word':'dört','start':.8,'end':1}]}]})
        with patch.dict(sys.modules,{'mlx_whisper':fake}):result=pro.align_project(self.identifier,{'project':self.project},production)['project']
        words=result['scenes'][0]['words'];self.assertEqual([w['matched'] for w in words],[True,False,False,True]);self.assertLess(words[1]['start'],words[2]['start'])


    def test_source_reference_check(self):
        doc=production.document('lesson.txt',b'A sufficient educational source document describing a lesson.')
        self.project['source']={k:doc[k] for k in ('id','name','sha256')};self.project['scenes'][0]['sourceRefs']=['invented']
        issues=pro.handle('quality',{'project':self.project},production)['issues']
        self.assertTrue(any('bölüm referansı' in i['message'] for i in issues))
