# 更新至v1.7.1

將ZIP內 `mbas-bazi` 的內容覆蓋到 `D:\Rex\mbas-bazi`，保留原本 `.git`，不要多套同名資料夾。如有自行改動，先備份。

CMD直接推送：

```cmd
cd /d "D:\Rex\mbas-bazi"
git add .
git commit -m "Fix essence wording and update MBAS to v1.7.1"
git push origin main
```

GitHub Actions沿用既有建置與部署流程。成功後Ctrl+F5，頁尾應為v1.7.1。確認本質總評與第一張卡片沒有重複句段，而且第一章不出現職涯或財務語彙；流年大運總覽每一步大運只有一列。無須在本機執行npm測試。
