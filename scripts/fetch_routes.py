import json, math, urllib.request

ROUTE_IDS=[56388289,56388368,56388443,56388861,56389083,56389125,56389299,56389323,56389345,56389425,56389487,56389526,56389756,56389882,56389934,56390767,56390804,56390834,56390864,56390904,56390966,56391001,56391037,56391061,56391157,56391189,56391214,56391316,56391375,56391386]

def hav(a,b):
    R=6371.0088
    p1,p2=math.radians(a[0]),math.radians(b[0])
    dp=math.radians(b[0]-a[0]); dl=math.radians(b[1]-a[1])
    h=math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2*R*math.asin(min(1,math.sqrt(h)))

def simplify(points, min_m=18):
    if len(points)<=2:return points
    out=[points[0]]; acc=0.0
    last=points[0]
    for p in points[1:-1]:
        d=hav(last,p)*1000
        acc+=d
        if acc>=min_m:
            out.append(p); last=p; acc=0.0
    out.append(points[-1])
    return out

routes={}
for idx,rid in enumerate(ROUTE_IDS,1):
    url=f'https://ridewithgps.com/routes/{rid}.json'
    req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
    with urllib.request.urlopen(req,timeout=45) as resp:
        data=json.load(resp)
    pts=data.get('track_points') or data.get('route',{}).get('track_points') or []
    coords=[]
    for p in pts:
        y=p.get('y',p.get('lat')); x=p.get('x',p.get('lng',p.get('lon')))
        if y is None or x is None: continue
        coords.append([round(float(y),6),round(float(x),6)])
    if len(coords)<2:
        raise RuntimeError(f'route {rid} has too few track points: {len(coords)}')
    total=sum(hav(a,b) for a,b in zip(coords,coords[1:]))
    simp=simplify(coords)
    cum=[0.0]
    for a,b in zip(simp,simp[1:]): cum.append(cum[-1]+hav(a,b))
    routes[str(idx)]={'route_id':rid,'distance_km':round(total,4),'points':simp,'cum_km':[round(x,4) for x in cum]}
    print(idx,rid,len(coords),'->',len(simp),round(total,3))

with open('route_tracks.js','w',encoding='utf-8') as f:
    f.write('window.ROUTE_TRACKS='+json.dumps(routes,ensure_ascii=False,separators=(',',':'))+';\n')
