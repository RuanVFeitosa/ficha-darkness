"""Rebuild the editable reader from the source PDF (pdfplumber required).

Usage: python scripts/import_rulebook.py path/to/book.pdf
Table regions are measured against the supplied 233-page edition, in PDF points.
They keep neighboring prose out of cells and retain wrapped cell text.
"""
import sys, json, re, logging, unicodedata
from pathlib import Path
import pdfplumber

logging.disable(logging.CRITICAL)
ROOT = Path(__file__).resolve().parents[1]
def clean(value):
    return re.sub(r'\s+', ' ', unicodedata.normalize('NFKC', value).replace('\u200b', '').replace('\u00ad', '')).strip()

# page: (column boundaries, row boundaries including the bottom, column labels)
TABLES = {
 8: [([72,135,229,280], [300,330,362,393,424,460], ['Estágio','Capacidade','Dado'],270)],
 21:[([72,125,180,290],[315,345,379,409,441,474],['Estágio','Dado','Custo acumulado'],265)],
 24:[([72,190,290],[314,345,377,405,440,470],['Dificuldade','Êxitos necessários'],286)],
 30:[([205,250,350,540],[518,550,582,613,646,678],['Grau','Domínio','Dados adicionais'],486)],
 32:[([305,384,425],[432,485,538,591,644,695],['Grau','Custo acumulado'],400)],
 76:[([72,170,290],[210,241,275,305,337,375],['Valor antigo','Dado'],178)],
 88:[([324,415,540],[258,320,382,444,507,548],['Impacto','Lesão'],198)],
 91:[([68,144,172,290],[362,394,427,458,490,521],['Sentido','Dado','Defesa'],320)],
 92:[([72,210,270,395,550],[376,406,453,483,512,542,571,601,630,660,697],['Arma','Dano','Tipo','Propriedades'],376)],
 94:[([72,180,225,290,390,550],[269,323,376,430,483,537,590,637],['Arma','Dano','Alcance','Capacidade','Propriedades'],215)],
 97:[([72,181,241,327,550],[177,231,302,356,409,463,535,606,666],['Proteção','Valor','Região','Especial'],124)],
 99:[([305,383,459],[383,448,514,565,638],['Condição','Efeito'],329)],
 182:[([305,478,560],[151,223,311,398,469,556,644,744],['Abordagem','Benefício'],151)],
 208:[([400,480,565],[268,300,331,363,400],['Atributo','Valor'],237)],
 209:[([72,130,290],[440,471,503,555,600],['Atributo','Valor'],387)],
 210:[([72,130,290],[641,704],['Atributo','Valor'],589)],
 211:[([72,130,290],[76,107,160,190],['Atributo','Valor'],76)],
 212:[([72,130,290],[378,431,462,515,547],['Atributo','Valor'],326)],
 214:[([72,130,290],[194,226,257,289,343],['Atributo','Valor'],142)],
 215:[([72,130,290],[606,659,697],['Atributo','Valor'],554)],
 216:[([72,130,290],[76,128,159],['Atributo','Valor'],76)],
}

CHAPTERS=[(1,'Abertura'),(6,'I · Personagens e regras básicas'),(79,'II · O combate contra a Espiral'),(105,'III · A investigação Espiral'),(119,'IV · As saídas para a Espiral'),(138,'V · O peso da pressão absoluta'),(159,'VI · A transformação'),(176,'VII · O que nos torna humanos'),(195,'VIII · Os monstros das nossas histórias'),(229,'Apêndice · Condições')]
# A subchapter is a topic, never an arbitrary PDF page. Continuations stay together.
TOPICS=[(2,'Prólogo'),(4,'Nota do autor'),(5,'Introdução'),(6,'Criação do personagem'),(7,'Atributos e características'),(12,'Pulso'),(14,'Razão'),(16,'Sentido'),(18,'Voz'),(20,'Escolha e custo dos atributos'),(22,'Rolagens de dados'),(23,'Recursos e resolução de testes'),(27,'Domínio e circunstâncias'),(30,'Graus e pontos de Recurso'),(34,'Os Recursos'),(38,'Integridade e lesões'),(45,'Sobrevivência e estabilização'),(48,'Vertentes'),(50,'Agressiva'),(51,'Metódica'),(52,'Adaptável'),(53,'Vigilante'),(54,'Resiliente'),(55,'Influente'),(56,'Obstinada'),(58,'Habilidades'),(61,'Habilidades ofensivas'),(64,'Habilidades de resistência'),(68,'Habilidades de percepção'),(71,'Habilidades de apoio'),(75,'Adaptação de personagens'),(79,'O combate contra a Espiral'),(81,'Armas'),(82,'Iniciativa'),(88,'Dano e gravidade das lesões'),(91,'Defesa e impacto'),(92,'Tipos de dano e armas brancas'),(93,'Armas improvisadas'),(94,'Armas de fogo'),(95,'Alcance e propriedades'),(96,'Proteções e cobertura'),(99,'Equipamentos'),(100,'Medicina e investigação'),(102,'Tecnologia e sobrevivência'),(103,'Infiltração e comunicação'),(104,'Visão e proteção ambiental'),(105,'A investigação Espiral'),(107,'Cenas de investigação'),(108,'Evidências e resultados'),(111,'Conectando evidências'),(112,'Interrogatórios e testemunhos'),(113,'Busca e auxílio'),(115,'Tempo e urgência'),(119,'As saídas para a Espiral'),(121,'Objetivos e tipos de conflito'),(123,'Transições e iniciativa'),(124,'Rodadas e ações'),(127,'Conflito, fuga e distâncias'),(132,'Proteger e carregar outra pessoa'),(134,'Sobrevivência e distrações'),(136,'Conflitos desiguais e encerramento'),(138,'O peso da pressão absoluta'),(140,'Sanidade e controle mental'),(146,'Esperança'),(148,'Pressão'),(152,'Ruptura'),(157,'Forçar-se'),(159,'A transformação'),(162,'Pontos de evolução'),(164,'Evolução de Recursos'),(165,'Evolução de atributos'),(167,'Novas habilidades'),(169,'Vertentes e evolução'),(171,'Limites humanos e marcos'),(172,'Aprendizado e tempo entre arcos'),(173,'Reorientação e novos personagens'),(174,'Evolução de NPCs e duração da campanha'),(176,'O que nos torna humanos'),(179,'Interpretação e argumentos'),(182,'Benefícios da interpretação'),(184,'Conhecimento e ideias'),(185,'Interação entre personagens'),(188,'Âncoras e conversas importantes'),(189,'Mentira, intimidação e empatia'),(191,'Resultados e consequências sociais'),(192,'Interpretação, contradições e grupo'),(195,'Os monstros das nossas histórias'),(197,'Ameaças'),(199,'Construindo uma ameaça'),(201,'A ficha de uma ameaça'),(205,'Regras próprias e ameaças não humanas'),(207,'Terror comportamental'),(208,'Agressor desesperado'),(209,'Criminoso armado'),(210,'Soldado ou mercenário'),(212,'O perseguidor'),(214,'O fanático'),(215,'O caçador'),(219,'Cão de guarda'),(220,'Incêndio'),(221,'Usando monstros na história'),(229,'Condições')]

def inside(c, box):
    x=(c['x0']+c['x1'])/2; y=(c['top']+c['bottom'])/2
    return box[0]<=x<box[2] and box[1]<=y<box[3]

def markdown_table(page,spec):
    xs,ys,labels,top=spec
    rows=[]
    for a,b in zip(ys,ys[1:]):
        row=[]
        for x,z in zip(xs,xs[1:]):
            chars=page.filter(lambda c: c.get('object_type')=='char' and inside(c,(x,a,z,b)))
            row.append(clean(chars.extract_text() or '').replace('|',r'\|'))
        rows.append(row)
    return '| '+' | '.join(labels)+' |\n| '+' | '.join(['---']*len(labels))+' |\n'+'\n'.join('| '+' | '.join(row)+' |' for row in rows)

def prose(region):
    output=[]; current=[]; prev=None; previous_heading=False
    def flush():
        if current: output.append(' '.join(current));current.clear()
    for line in region.extract_text_lines(return_chars=True):
        text=clean(line['text'])
        if not text or re.fullmatch(r'\d{1,3}',text): continue
        size=sum(c['size'] for c in line['chars'])/max(1,len(line['chars']))
        heading=(size>=17 and len(text)<150) or bool(re.match(r'^[△⬡◇⬟⬢]\d+\s*\|',text))
        bullet=text.startswith(('●','•'))
        if heading or bullet or (prev is not None and line['top']-prev>10): flush()
        if heading:
            if previous_heading and output: output[-1]+=' '+text
            else: output.append('## '+text)
        elif bullet: output.append('- '+text.lstrip('●• '))
        else: current.append(text)
        previous_heading=heading;prev=line['bottom']
    flush()
    return '\n\n'.join(output)

def extract(page,n):
    specs=TABLES.get(n,[])
    boxes=[(s[0][0],s[3],s[0][-1],s[1][-1]) for s in specs]
    filtered=page.filter(lambda c: c.get('object_type')!='char' or not any(inside(c,b) for b in boxes))
    body=[c for c in filtered.chars if c['top']>160 and c['text'].strip()]
    density=sum(290<c['x0']<320 for c in body)/max(1,len(body))
    # Mixed-width layouts: full-width introduction, then independent columns.
    split=density<.018 and sum(c['x0']>310 for c in body)>80
    regions=[]
    if n in (9,10):
        middle=395 if n==9 else 300
        regions=[(0,0,306,middle),(306,0,612,middle),(0,middle,306,792),(306,middle,612,792)]
    elif n==32:
        regions=[(0,0,612,390),(0,390,300,792),(300,390,425,792),(425,390,612,792)]
    elif split:
        header=[c for c in filtered.chars if c['top']<135 and 290<c['x0']<320]
        start=max((c['bottom'] for c in header),default=0)+3 if header else 0
        if start: regions.append((0,0,612,start))
        regions.extend([(0,start,306,792),(306,start,612,792)])
    else: regions=[(0,0,612,792)]
    parts=[]
    for region in regions:
        tables=[(s,b) for s,b in zip(specs,boxes) if region[0]<=b[0]<region[2] and region[1]<=b[1]<region[3]]
        cursor=region[1]
        for spec,box in sorted(tables,key=lambda t:t[1][1]):
            # If a table is narrower than a column, extract adjacent commentary separately.
            parts.append(prose(filtered.crop((region[0],cursor,region[2],box[1]))))
            parts.append(markdown_table(page,spec))
            for a,b in [(region[0],box[0]),(box[2],region[2])]:
                if b-a>25: parts.append(prose(filtered.crop((a,box[1],b,box[3]))))
            cursor=box[3]
        if cursor<region[3]: parts.append(prose(filtered.crop((region[0],cursor,region[2],region[3]))))
    return '\n\n'.join(p for p in parts if p)

def main():
    pdf=pdfplumber.open(sys.argv[1]);sections=[]
    def append(section,content,n):
        if not content.strip(): return
        continued_table = section['content'].rstrip().endswith('|') and content.startswith('| Atributo | Valor |\n| --- | --- |\n')
        if continued_table: content='\n'.join(content.split('\n')[2:])
        if section['content']: section['content']+='\n' if continued_table else '\n\n'
        begin=len(section['content']);section['content']+=content
        section['sourceSpans'].append({'page':n,'start':begin,'end':len(section['content'])})
        section['sourceEndPage']=n
        if n not in section['sourcePages']:section['sourcePages'].append(n)
    for n,page in enumerate(pdf.pages,1):
        if n<2: continue
        content=extract(page,n)
        if not content.strip(): continue
        topics=[(67 if p==68 else 70 if p==71 else 213 if p==214 else p,t) for p,t in TOPICS]
        start,title=next((p,t) for p,t in reversed(topics) if p<=n)
        chapter=next(t for p,t in reversed(CHAPTERS) if p<=n)
        transitions={67:'## HABILIDADES DE PERCEPÇÃO',70:'## HABILIDADES DE APOIO',213:'## AMEAÇA PRONTA — O FANÁTICO'}
        if n in transitions and transitions[n] in content and sections:
            prefix,content=content.split(transitions[n],1)
            append(sections[-1],prefix,n)
            content=transitions[n]+content
        if not sections or sections[-1]['id']!=f'topic-{start}':
            sections.append({'id':f'topic-{start}','title':title,'chapter':chapter,'content':'','sourcePage':n,'sourceEndPage':n,'sourcePages':[],'sourceSpans':[]})
        append(sections[-1],content,n)
    data={'version':1,'edition':2,'title':'Protocolo Darkness RPG','source':'PROTOCOLO DARKNESS RPG.pdf','sourcePages':len(pdf.pages),'sections':sections}
    (ROOT/'frontend/src/data/darknessRulebook.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf8')
    print(f'{len(sections)} subchapters; {sum(len(TABLES.get(n,[])) for n in range(1,234))} tables')

if __name__=='__main__':main()
