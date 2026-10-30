# 更新至v1.8.0

將ZIP內 `mbas-bazi` 的內容覆蓋到 `D:\Rex\mbas-bazi`，保留原本 `.git`，不要多套同名資料夾。如有自行改動，先備份。

CMD直接推送：

```cmd
cd /d "D:\Rex\mbas-bazi"
git add .
git commit -m "Rewrite MBAS narratives and five-element guidance in v1.8.0"
git push origin main
```

GitHub Actions沿用既有建置與部署流程。成功後Ctrl+F5，頁尾應為v1.8.0。請用數張不同命盤確認本質總評有實質差異，並確認五行頁只有一個整體總評、個別五行以生活情境說明過少／適中／過多。無須在本機執行npm測試。
