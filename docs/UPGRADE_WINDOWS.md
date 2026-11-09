# 更新至 v4.0.0

將ZIP內 `mbas-bazi` 的內容覆蓋到 `D:\Rex\mbas-bazi`，保留原本 `.git`，不要多套同名資料夾。如有自行改動，先備份。

CMD直接推送：

```cmd
cd /d "D:\Rex\mbas-bazi"
git add .
git commit -m "Release MBAS v4.0.0 unified rules and searchable PDF"
git push origin main
```

GitHub Actions 沿用既有建置與部署流程。成功後按 Ctrl+F5，頁尾應為 v4.0.0。產生命盤後點擊「匯出 PDF」，下載檔案應包含命盤與完整五章，文字可搜尋及複製。
