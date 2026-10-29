# 更新至v1.6.1

將ZIP內 `mbas-bazi` 的內容覆蓋到 `D:\Rex\mbas-bazi`，保留原本 `.git`，不要多套同名資料夾。如有自行改動，先備份。

CMD直接推送：

```cmd
cd /d "D:\Rex\mbas-bazi"
git add .
git commit -m "Fix MBAS v1.6.1 deployment"
git push origin main
```

GitHub Actions沿用既有建置與部署流程。成功後Ctrl+F5，頁尾應為v1.6.1。確認本質頁置頂總評與第一張詳細卡片內容不同，並依序顯示核心需求、日常反應、內在拉扯、快樂與恢復、一生生活配置。無須在本機執行npm測試。
