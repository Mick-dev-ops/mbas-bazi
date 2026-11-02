# 更新至 v2.2.0

將ZIP內 `mbas-bazi` 的內容覆蓋到 `D:\Rex\mbas-bazi`，保留原本 `.git`，不要多套同名資料夾。如有自行改動，先備份。

CMD直接推送：

```cmd
cd /d "D:\Rex\mbas-bazi"
git add .
git commit -m "Release MBAS v2.2.0 with differentiated luck-cycle narratives"
git push origin main
```

GitHub Actions 沿用既有建置與部署流程。成功後按 Ctrl+F5，頁尾應為 v2.2.0。請以數張不同命盤確認「流年大運」的十年總覽不再反覆出現「重新安排順序」，且每一步大運會依十神角色、人生階段與實際作用產生不同內容。無須在本機執行 npm 測試。
