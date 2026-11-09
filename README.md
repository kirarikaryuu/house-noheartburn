# 地产不烧心

天津市区与环城四区二手房成交行情的静态展示站。项目基于抖音房产中介公开发布的成交图集，经过 OCR、字段校验、重复成交归并和自动审核后，仅发布聚合统计与去重成交明细，不发布原始截图、中介身份或采集端数据。

线上地址：<https://kirarikaryuu.github.io/house-noheartburn/>

数据口径：

- 范围：和平、河东、河西、南开、河北、红桥、东丽、西青、津南、北辰。
- 页面中的价格为中介公开成交记录汇总，不代表官方网签或不动产登记数据。
- 缺失月份不插值；样本不足时隐藏趋势值。
- 公开仓库只包含前端代码、聚合 JSON 和数据 Schema，不包含后端采集程序、SQLite、原始图片、Cookie 或审核日志。

本地运行：

```bash
npm ci
npm run dev
```

构建 GitHub Pages 子路径产物：

```bash
NEXT_PUBLIC_BASE_PATH=/house-noheartburn npm run build
```

产物位于 `apps/web/out/`。`main` 分支推送后由 GitHub Actions 校验数据、构建并部署 Pages。
