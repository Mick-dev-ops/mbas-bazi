# 更新至v1.9.0

將ZIP內 `mbas-bazi` 的內容覆蓋到 `D:\Rex\mbas-bazi`，保留原本 `.git`，不要多套同名資料夾。如有自行改動，先備份。

CMD直接推送：

```cmd
cd /d "D:\Rex\mbas-bazi"
git add .
git commit -m "Simplify MBAS timelines and expand relationship guidance in v1.9.0"
git push origin main
```

GitHub Actions沿用既有建置與部署流程。成功後Ctrl+F5，頁尾應為v1.9.0。請確認財運與大運短評不再顯示藏干依據、緣分頁出現婚姻／子女／父母／貴人結論、五行卡不再拆成整體與今年兩段，並以手機確認四柱維持單列。無須在本機執行npm測試。
