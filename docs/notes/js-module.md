---
title: 模块化：符号绑定和值拷贝
---
# 模块化：符号绑定和值拷贝
我们先从一个简单的计数器函数来看
```js
function counter(){
    var count = 0;
    function increase() {
        count++;
    }
    return {
        count,
        increase
    }
}
const { count, increase } = counter()
console.log(count)
increase()
console.log(count)
```
猜测一下输出会是什么?  会是0 1吗？

```js
0
0
```
显然，js基础好的同学可以看出显然这里是源于JS的值拷贝，counter函数返回一个对象，这个对象上的count实际上是一个从count变量拷贝过去的值。  
实际上在现代js基于模块化的开发中，这个场景可能更复杂些，现在我们考虑把counter函数封装为一个模块。  
## ESM模块
```js
// counter.mjs
var count = 0;
function increase() {
  count++;
}
export { count, increase };

// esm.mjs
import { count, increase } from "./counter.mjs";
console.log(count);
increase();
console.log(count);

//output
0
1
```
为什么ESM模块里返回的count会响应修改呢？这是因为ESM模块静态分析的特点，ESM模块会把导入导出的值实时绑定起来，这与值拷贝不同，更接近其它语言中的引用传递。  
当然ESM导出时也需要注意用法，必须使用`export`单独导出值，如果使用`export default`的方法来导出，那么仍然是值拷贝的。
```js
// counter.mjs
export default { count, increase };
// output
0
0
```
## CommonJS
再看一下cjs的模块化
```js
// counter.js
var count = 0;
function increase() {
  count++;
}
module.exports = { count, increase };
// cjs.js
const { count, increase } = require("./counter.js");
console.log(count);
increase();
console.log(count);
// output
0
0
```
可以看出cjs模块仍然是值拷贝的

## 总结
ESM模块具有静态分析和实时绑定的特点，模块导出值都具有引用传递的特点，当模块中的值变化时，导入变量的模块会实时响应变化。  
CJS模块则具有动态加载的特点，模块导出值都是拷贝的副本，不会实时反映模块内的变化。  
实际开发中，当我们需要在模块内处理共享数据、共享状态时需要注意这一点。