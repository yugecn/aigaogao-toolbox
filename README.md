# 搞搞股票工具箱

Kendy 的私人 A 股工具箱：板块实时追踪（申万一级/二级 9 日涨跌、成交额、涨跌家数）+ 成本价、钱流等工具。仅研究自用，非投资建议。

## 链接
- 在线打开工具箱：https://yugecn.github.io/aigaogao-toolbox/
- 原版参考（爱搞搞·升跌对比，时光机存档）：https://web.archive.org/web/20230102215122/https://www.aigaogao.com/tools/pricecompare.html

## 行情来源
- 盘中实时（交易时段每 5 秒刷新）：腾讯 qt.gtimg.cn 为主，新浪 Market_Center.getHQNodeData 备用。
- 收盘后每日更新：腾讯前复权 K 线 + 新浪申万成分。

## 文件
- `index.html`：整个页面，数据内嵌（`const SEC=...`），双击即可打开。
- `data/update.py`：每日一键更新，在 `data/` 目录运行 `python3 update.py`
  1. `sw.py` 刷新申万行业成分 → `sw.json`
  2. `kl3.py` 拉全部个股 25 日前复权 K 线（腾讯行情）→ `kl3.json`
  3. `build_sec.py` 生成板块数据 → `sec_data.json`
  4. 把新数据写回 `../index.html`
- `data/sec_panel.js`：板块面板脚本；`sectors.json`、`swnodes.json`：行业结构。
