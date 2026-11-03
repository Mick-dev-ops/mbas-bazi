# 更新至 v3.1.0

將ZIP內 `mbas-bazi` 的內容覆蓋到 `D:\Rex\mbas-bazi`，保留原本 `.git`，不要多套同名資料夾。如有自行改動，先備份。

CMD直接推送：

```cmd
cd /d "D:\Rex\mbas-bazi"
git add .
git commit -m "Release MBAS v3.1.0 direct PDF download"
git push origin main
```

GitHub Actions 沿用既有建置與部署流程。成功後按 Ctrl+F5，頁尾應為 v3.1.0。產生命盤後點擊「匯出 PDF」，瀏覽器應直接下載檔案，不再開啟列印視窗。
