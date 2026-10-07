"""Integrated studio tools. Shared JS contract; bounded math AST; private revisions/media."""
import ast,copy,hashlib,io,json,math,re,subprocess,uuid,zipfile,time
from pathlib import Path
import animation_api as ai

def contract(project):
    run=subprocess.run(['node',str(ai.ROOT/'tools/pro_contract.mjs')],input=json.dumps(project).encode(),capture_output=True,timeout=30,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
    if run.returncode: raise ValueError(run.stderr.decode('utf-8','replace')[:300] or 'Proje sözleşmesi geçersiz')
    return json.loads(run.stdout)

def math_expression(text):
    import sympy as sp
    if not isinstance(text,str) or len(text)>160: raise ValueError('İfade en fazla 160 karakter olmalı')
    try:tree=ast.parse(text.replace('^','**'),mode='eval')
    except SyntaxError:raise ValueError('Matematik ifadesinin yazımı geçersiz')
    if len(list(ast.walk(tree)))>80: raise ValueError('İfade çok karmaşık')
    funcs={k:getattr(sp,k) for k in ('sin','cos','tan','sqrt','exp','log','abs') if hasattr(sp,k)};funcs['abs']=sp.Abs
    def build(n):
        if isinstance(n,ast.Constant) and type(n.value) in (int,float) and abs(n.value)<=100000:return sp.Rational(str(n.value))
        if isinstance(n,ast.Name):
            if n.id in ('x','y','a'):return sp.Symbol(n.id,real=True)
            if n.id=='pi':return sp.pi
        if isinstance(n,ast.UnaryOp) and isinstance(n.op,(ast.USub,ast.UAdd)):return -visit(n.operand) if isinstance(n.op,ast.USub) else visit(n.operand)
        if isinstance(n,ast.BinOp):
            left,right=visit(n.left),visit(n.right)
            if isinstance(n.op,ast.Add):return left+right
            if isinstance(n.op,ast.Sub):return left-right
            if isinstance(n.op,ast.Mult):return left*right
            if isinstance(n.op,ast.Div):return left/right
            if isinstance(n.op,ast.Pow) and right.is_number and abs(float(right))<=12:return left**right
        if isinstance(n,ast.Call) and isinstance(n.func,ast.Name) and n.func.id in funcs and len(n.args)==1 and not n.keywords:return funcs[n.func.id](visit(n.args[0]))
        raise ValueError('Yalnızca x, y, a, pi, sayılar, aritmetik ve sin/cos/tan/sqrt/exp/log/abs kullanılabilir')
    def visit(n):
        value=build(n)
        if any(power.exp.is_number and abs(float(power.exp))>12 for power in value.atoms(sp.Pow)):raise ValueError('İç içe üs ifadesi çok büyük')
        if value.is_number:
            try:numeric=float(value)
            except (TypeError,ValueError,OverflowError):raise ValueError('Sayısal ifade tanımsız veya çok büyük')
            if not math.isfinite(numeric) or abs(numeric)>1e12:raise ValueError('Sayısal ifade çok büyük')
        return value
    return visit(tree.body)

def math_tool(request):
    import sympy as sp
    expr=math_expression(request.get('expression',''));x=sp.Symbol('x',real=True);a=sp.Symbol('a',real=True)
    action=request.get('action','plot');result={'latex':sp.latex(expr),'expression':str(expr)}
    if action=='equivalence':
        other=math_expression(request.get('other',''));difference=sp.simplify(expr-other)
        result.update(equivalent=difference==0,domainNote='Eşitlik tanımlı oldukları ortak bölgede değerlendirilir; tekillikler ayrıca incelenmelidir.',difference=str(difference));return result
    if action=='derivative':expr=sp.diff(expr,x);result.update(result=str(expr),latex=sp.latex(expr));return result
    if action=='integral':
        try:degree=sp.Poly(expr,x).degree()
        except sp.PolynomialError:raise ValueError('Belirli integral aracı şu anda polinomları destekliyor')
        if degree>10:raise ValueError('Bu sürümde belirli integral için en fazla 10. derece polinom kullan')
        low=float(request.get('from',0));high=float(request.get('to',1))
        if not math.isfinite(low+high) or abs(low)>1000 or abs(high)>1000:raise ValueError('Sınırlar geçersiz')
        value=sp.integrate(expr,(x,low,high));result.update(result=str(value),latex=sp.latex(value));return result
    if action!='plot':raise ValueError('Matematik işlemi geçersiz')
    low=float(request.get('from',-3));high=float(request.get('to',3));parameter=float(request.get('parameter',1))
    if not math.isfinite(low+high+parameter) or not -1000<=low<high<=1000 or abs(parameter)>1000:raise ValueError('Grafik sınırları geçersiz')
    points=[]
    for i in range(161):
        xx=low+(high-low)*i/160
        try: yy=float(expr.subs({x:xx,a:parameter}));points.append([xx,yy] if math.isfinite(yy) and abs(yy)<10000 else None)
        except (TypeError,ValueError,OverflowError):points.append(None)
    if sum(v is not None for v in points)<2:raise ValueError('Bu aralıkta çizilebilir grafik yok')
    result.update(points=points);return result

def revision(project,production):
    p=production.validate_project(project);root=production.folder(p['id'])/'revisions';root.mkdir(parents=True,exist_ok=True)
    digest=hashlib.sha256(json.dumps(p,sort_keys=True).encode()).hexdigest();files=sorted(root.glob('*.json'))
    if files and production.read(files[-1]).get('digest')==digest:return {'id':p['id'],'revision':files[-1].stem}
    identifier=f'{time.time_ns():020}';production.write(root/(identifier+'.json'),{'digest':digest,'createdAt':time.time(),'project':p});return {'id':p['id'],'revision':identifier}

def package(project,production):
    p=production.validate_project(project);identifier=str(uuid.uuid4());root=production.folder(identifier);root.mkdir(parents=True)
    media={};copy_project=copy.deepcopy(p)
    for item in [*(s.get('audio') for s in copy_project['scenes']),copy_project.get('music')]:
        if not item:continue
        url=item['url'];path=production.asset_path(url);name='media/'+hashlib.sha256(path.read_bytes()).hexdigest()[:20]+'.wav';media[name]=path;item['url']='package:'+name
    with zipfile.ZipFile(root/'project.zip','w',zipfile.ZIP_DEFLATED) as z:
        z.writestr('project.json',json.dumps(copy_project,ensure_ascii=False));z.writestr('captions.srt',contract(p)['srt']);z.writestr('captions.vtt',contract(p)['vtt'])
        if p.get('source') and p['source'].get('id'):z.writestr('source.json',json.dumps(production.read(production.folder(p['source']['id'])/'document.json'),ensure_ascii=False))
        for name,path in media.items():z.write(path,name)
    return {'url':f'/api/animation/assets/{identifier}/project.zip'}

def import_package(content,production):
    identifier=str(uuid.uuid4());root=production.folder(identifier);root.mkdir(parents=True)
    with zipfile.ZipFile(io.BytesIO(content)) as z:
        if sum(i.file_size for i in z.infolist())>250*1024*1024 or len(z.infolist())>500:raise ValueError('Paket çok büyük')
        p=json.loads(z.read('project.json'));p['id']=str(uuid.uuid4())
        for item in [*(s.get('audio') for s in p['scenes']),p.get('music')]:
            if not item:continue
            if not re.fullmatch(r'package:media/[0-9a-f]{20}\.wav',item['url']):raise ValueError('Paket medya adresi geçersiz')
            name=item['url'][8:];target=root/Path(name).name;target.write_bytes(z.read(name));item['url']=f'/api/animation/assets/{identifier}/{target.name}'
        if 'source.json' in z.namelist():
            source=json.loads(z.read('source.json'));source['id']=str(uuid.uuid4());production.write(production.folder(source['id'])/'document.json',source);p['source']={k:source[k] for k in ('id','name','sha256')}
    return {'project':production.validate_project(p)}

def align_project(identifier,request,production):
    import difflib,unicodedata,mlx_whisper
    p=production.validate_project(request['project'])
    norm=lambda w:''.join(c for c in unicodedata.normalize('NFD',w.casefold()) if c.isalnum())
    for i,s in enumerate(p['scenes']):
        production.check_cancel(identifier)
        if not s.get('audio'):continue
        production.update(identifier,progress=round(i/len(p['scenes'])*100),message=f'Konuşma hizalanıyor · {i+1}/{len(p["scenes"])}')
        result=mlx_whisper.transcribe(str(production.asset_path(s['audio']['url'])),language='tr',word_timestamps=True)
        heard=[w for segment in result['segments'] for w in segment.get('words',[])];reference=s['narration'].split();matches={}
        for block in difflib.SequenceMatcher(None,[norm(w) for w in reference],[norm(w['word']) for w in heard],autojunk=False).get_matching_blocks():
            for k in range(block.size):matches[block.a+k]=heard[block.b+k]
        # Missing words are interpolated explicitly; coverage is shown to the user.
        spans={k:(float(v['start']),float(v['end'])) for k,v in matches.items()};k=0
        while k<len(reference):
            if k in spans:k+=1;continue
            first=k
            while k<len(reference) and k not in spans:k+=1
            left=spans[first-1][1] if first else 0;right=spans[k][0] if k<len(reference) else s['audio']['duration'];step=max(0,right-left)/(k-first)
            for j in range(first,k):spans[j]=(left+(j-first)*step,left+(j-first+1)*step)
        words=[]
        for k,w in enumerate(reference):
            start,end=spans[k];start=max(words[-1]['start'] if words else 0,min(start,s['duration']));end=max(start,min(end,s['duration']));words.append({'w':w,'start':round(start,3),'end':round(end,3),'matched':k in matches})
        s['words']=words;s['alignment']=f'Whisper {len(matches)}/{len(reference)}';production.write(production.folder(identifier)/'project.json',p)
    return {'project':p}

def patch_project(identifier,request,production):
    p=production.validate_project(request['project']);index=request.get('sceneIndex',0)
    if type(index)!=int or not 0<=index<len(p['scenes']):raise ValueError('Sahne bulunamadı')
    s=p['scenes'][index];target=request.get('objectId');scope=request.get('scope','object' if target else 'scene');prompt=request.get('prompt','')
    if scope not in ('object','scene','background','interval'):raise ValueError('Düzeltme alanı geçersiz')
    if not isinstance(prompt,str) or not 5<=len(prompt)<=2000:raise ValueError('Düzeltme isteği 5–2000 karakter olmalı')
    old=next((o for o in s['objects'] if o['id']==target),None)
    if scope=='object' and not old:raise ValueError('Nesne bulunamadı')
    if old and old['locked']:raise ValueError('Nesne kilitli; önce kilidini kaldır')
    if scope=='background' and p['style']['locked']:raise ValueError('Arka plan proje stiline kilitli')
    low=float(request.get('from',0));high=float(request.get('to',s['duration']))
    if scope=='interval' and not 0<=low<high<=s['duration']:raise ValueError('Düzeltme zaman aralığı geçersiz')
    production.update(identifier,message='GLM seçili bölge için düzeltme hazırlıyor',progress=10)
    context={'title':s['title'],'duration':s['duration'],'narration':s['narration'][:450],'palette':p['style']['palette'],'background':s['background'],'notes':s['notes'][:200], 'target':{k:old[k] for k in ('type','x','y','width','height','color','text')} if old else None, 'entities':[o['entityId'] for o in s['objects'] if o['entityId']]}
    instructions='Edit '+scope+'. Preserve composition unless explicitly requested. For a selected target make its replacement the FIRST object. '+prompt+'\nCURRENT: '+json.dumps(context,ensure_ascii=False)
    code,result=ai.generate({'category':s['category'],'prompt':instructions[:3000]})
    if code!=200:raise ValueError(result['error'])
    production.check_cancel(identifier)
    generated=result['scene'];changes=[]
    if scope=='background':s['background']=generated['background'];changes=['Arka plan rengi']
    elif scope=='object':
        new=generated['objects'][0];meta={k:v for k,v in old.items() if k not in ai.scene_schema()['properties']['objects']['items']['required']};old.update(new);old.update(meta);old['start']=min(old['start'],s['duration']-.1);changes=[old['name']]
    else:
        retained=[o for o in s['objects'] if o['locked'] or scope=='interval' and not low<=o['start']<high]
        replacements=generated['objects']
        for o in replacements:
            o['id']=str(uuid.uuid4());o['start']=min(s['duration']-.1,o['start'])
            if scope=='interval':o['start']=min(high-.1,low+o['start']/generated['duration']*(high-low));o['duration']=min(o['duration'],high-o['start'])
        s['objects']=retained+replacements;s['composed']=True;changes=['Seçili zaman aralığı' if scope=='interval' else 'Sahne çizimi · kilitli nesneler korundu']
    updated=production.validate_project(p);return {'project':updated,'changes':changes,'sceneIndex':index,'patch':{'scope':scope,'sceneId':s['id'],'objectId':target},'originalProject':request['project']}

def handle(path,request,production):
    if path=='math':return math_tool(request)
    if path=='quality':
        p=production.validate_project(request['project']);issues=contract(p)['issues']
        if p.get('source'):
            try:refs={s['ref'] for s in production.read(production.folder(p['source']['id'])/'document.json')['sections']}
            except (FileNotFoundError,ValueError,KeyError):refs=set()
            for s in p['scenes']:
                if any(ref not in refs for ref in s['sourceRefs']):issues.append({'scene':s['id'],'object':'','kind':'warning','message':'Kaynakta bulunmayan bölüm referansı var'})
        return {'issues':issues}
    if path=='revision':return revision(request['project'],production)
    if path=='versions':
        root=production.folder(request['id'])/'revisions';return {'versions':[{'revision':p.stem,'createdAt':production.read(p)['createdAt'],'name':production.read(p)['project']['name']} for p in sorted(root.glob('*.json'),reverse=True)[:50]]}
    if path=='restore':
        if not re.fullmatch(r'\d{20}',request.get('revision','')):raise ValueError('Sürüm geçersiz')
        return {'project':production.read(production.folder(request['id'])/'revisions'/(request['revision']+'.json'))['project']}
    if path=='package':return package(request['project'],production)
    if path=='captions':
        p=production.validate_project(request['project']);identifier=str(uuid.uuid4());root=production.folder(identifier);root.mkdir(parents=True);data=contract(p)
        for fmt in ('srt','vtt'):(root/('captions.'+fmt)).write_text(data[fmt],encoding='utf-8')
        return {'srt':f'/api/animation/assets/{identifier}/captions.srt','vtt':f'/api/animation/assets/{identifier}/captions.vtt'}
    raise ValueError('Stüdyo aracı bulunamadı')
