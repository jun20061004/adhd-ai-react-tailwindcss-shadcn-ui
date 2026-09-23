import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";

//获取真实的DOM节点作为React应用的挂载容器
const rootElement = document.getElementById("root");

//严谨的空值检测，符合官方推荐的最佳实践，彻底消除非空断言操作符带来的解析隐患
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
