# 更新至 v3.0.0

將ZIP內 `mbas-bazi` 的內容覆蓋到 `D:\Rex\mbas-bazi`，保留原本 `.git`，不要多套同名資料夾。如有自行改動，先備份。

CMD直接推送：

```cmd
cd /d "D:\Rex\mbas-bazi"
git add .
git commit -m "Release MBAS v3.0.0 shared decision model and benefactor timeline"
git push origin main
```

GitHub Actions 沿用既有建置與部署流程，並新增 131 組規則覆蓋檢查。成功後按 Ctrl+F5，頁尾應為 v3.0.0。請用數張不同日主、月令與大運的命盤核對格局名稱、三種五行順位、貴人未來十年及逐運時間表。
