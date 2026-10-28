# Windows 更新現有專案

先保留原本專案的備份。將這個 ZIP 解壓縮，將 `mbas-bazi` 內的檔案覆蓋到 `D:\Rex\mbas-bazi`。保留該資料夾原本的 `.git`，不要清空 GitHub，也不要刪除 Git 紀錄。

確認沒有多套一層 `mbas-bazi`，並確認 `package.json` 的版本為 1.1.1。開啟 CMD：

```cmd
cd /d "D:\Rex\mbas-bazi"
npm ci
npm run check
git status
git add .
git commit -m "Fix structural use adjudication and expand formal reports"
git push origin main
```

若 `git push` 顯示遠端有新提交，不要使用 force；先保留錯誤訊息與本機變更，確認遠端差異再合併。若有自己額外修改的程式，也請先備份或提交再覆蓋。

Actions 成功後重新整理網站，確認「方法說明」中顯示 `mbas-1.1.0` 及 `zh-TW-1.1.0`。用相同出生資料重算，舊 PDF 不會自動更新。

本次 1.1.1 表單更新可用提交訊息 `Update birth form to single-column layout`，方法說明會另列 `ui-1.1.1`。
