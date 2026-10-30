# 更新至v2.0.0

將ZIP內 `mbas-bazi` 的內容覆蓋到 `D:\Rex\mbas-bazi`，保留原本 `.git`，不要多套同名資料夾。如有自行改動，先備份。

CMD直接推送：

```cmd
cd /d "D:\Rex\mbas-bazi"
git add .
git commit -m "Release MBAS v2.0.0 with Zi Ping structure analysis"
git push origin main
```

GitHub Actions沿用既有建置與部署流程。成功後Ctrl+F5，頁尾應為v2.0.0。請確認四柱下方出現「月令格局解讀」、五行卡只有一個「今年第1順位・優先調整」，並以手機確認四柱依年、月、日、時由上而下排列且沒有水平捲動條。無須在本機執行npm測試。
