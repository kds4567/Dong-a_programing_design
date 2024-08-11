import pandas as pd
import requests




#팀별 승률 df
url = 'https://www.koreabaseball.com/Record/TeamRank/TeamRankDaily.aspx'
tables = pd.read_html(url)
dfteamwin = pd.DataFrame(tables[0],columns=['순위','팀명','승률'])
print(dfteamwin)

#선수별 세부지표 df
url = 'https://www.koreabaseball.com/Record/Player/HitterBasic/Detail1.aspx'
tables = pd.read_html(url)
dfdetailhit = pd.DataFrame(tables[0])
print(dfdetailhit)

#선수(타자)별 기본기록 df
url = 'https://www.koreabaseball.com/Record/Player/HitterBasic/Basic1.aspx?sort=HRA_RT'
tables = pd.read_html(url)
dfnormalhit = pd.DataFrame(tables[0])
print(dfnormalhit)

#선수(투수)별 기본기록 df 
url = 'https://www.koreabaseball.com/Record/Player/PitcherBasic/Basic1.aspx'
tables = pd.read_html(url)
dfmormalthrow=pd.DataFrame(tables[0])
print(dfmormalthrow)

#선수(투수)별 세부기록 df
url = 'https://www.koreabaseball.com/Record/Player/PitcherBasic/Detail1.aspx'
tables = pd.read_html(url)
dfdetailthrow=pd.DataFrame(tables[0])
print(dfdetailthrow)
