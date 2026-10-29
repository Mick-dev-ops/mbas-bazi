# 更新至v1.7.2

將ZIP內 `mbas-bazi` 的內容覆蓋到 `D:\Rex\mbas-bazi`，保留原本 `.git`，不要多套同名資料夾。如有自行改動，先備份。

CMD直接推送：

```cmd
cd /d "D:\Rex\mbas-bazi"
git add .
git commit -m "Group finance timeline by luck cycle in v1.7.2"
git push origin main
```

GitHub Actions沿用既有建置與部署流程。成功後Ctrl+F5，頁尾應為v1.7.2。確認財運與流年大運兩份總覽都以每一步大運一列，不再出現「人生階段」欄位。無須在本機執行npm測試。
