# 更新現有GitHub專案至1.4.0

將ZIP解壓，把 `mbas-bazi` 裡的全部內容覆蓋到 `D:\Rex\mbas-bazi`；保留原本 `.git`，不要清空GitHub，也不要多套一層同名資料夾。如有自行改動，先備份。

CMD：

```cmd
cd /d "D:\Rex\mbas-bazi"
npm ci
npm run check
git status
git add .
git commit -m "Fix structural judgments and annual rule deltas"
git push origin main
```

確認Pages來源為GitHub Actions。Actions的測試、建置與deploy皆成功後開啟網站並Ctrl+F5，頁尾應為 **v1.4.0**。若遠端有新提交，先確認差異再合併，不用force推送。

本版沒有附新的命盤HTML預覽或PDF。舊版 `docs/REPORT_REVIEW.html` 若仍留在本機，不代表新系統的輸出；驗收請自行在網站輸入資料。

請檢查：出生下拉選單、四柱詳細資料、五個頁籤；本質短依據；財務三問題；緣分合作專節；原局／操作／當期三種順序；交運年份分段；A4列印預覽。瀏覽器原生網址及日期須關閉「頁首及頁尾」。
