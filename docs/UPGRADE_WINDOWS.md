# 更新至v1.5.0

將ZIP內 `mbas-bazi` 的內容覆蓋到 `D:\Rex\mbas-bazi`，保留原本 `.git`，不要多套同名資料夾。如有自行改動，先備份。

CMD直接推送：

```cmd
cd /d "D:\Rex\mbas-bazi"
git add .
git commit -m "Update MBAS to v1.5.0"
git push origin main
```

GitHub Actions沿用既有建置與部署流程。成功後Ctrl+F5，頁尾應為v1.5.0。確認五頁置頂總評，以及財運70與80歲分段與不同運年的描述。無須在本機執行npm測試。
