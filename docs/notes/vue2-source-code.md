---
title: Vue2源码阅读笔记
outline: [2,4]
---
# Vue2源码阅读笔记
## 文件目录结构
vue仓库使用pnpm构建monorepo，目录结构如下：
- benchmarks 
- compiler-src 直接引用packages/compiler-src
- examples 示例Demo
- packages 单独发布的包
  - compiler-src 单文件组件编译器
  - server-renderer ssr版本,只引用打包文件
  - template-compiler 模板编译器,只引用打包文件
- scripts 构建打包相关的配置与脚本
- src
  - compiler 模板编译器相关源码
  - core vue核心模块
  - platforms/web 运行时版本入口，支持template选项和dom模板
  - shared 一些公共代码
  - types 类型定义文件
  - v3
- test 测试代码，包括单元测试、e2e测试
- types 类型定义文件

## 核心模块
### 全局API
> core/global-api/index

Vue在这里集中注册Vue的全局API，包括全局配置、指令定义、过滤器等
```ts
function Vue(options){
  return this._init(options)
}
Vue.set()
Vue.delete()
Vue.nextTick()
Vue.observable()
Vue.use()
Vue.mixin()
Vue.components()
Vue.directive()
Vue.extend()
```
### Vue核心逻辑
#### 依赖注入的实现
首先我们来看Vue组件的inject取值的实现方式，这里是直接从当前Vue的provided属性上获取，因为初始化provided时，它的原型会被指向父组件的provided，那么解析inject时便会在这条provided原型链上向上搜索（一个细节是初始化时initInject在initProvide之前，如果当前组件provide有同名属性也不会影响注入值）
```ts
function resolveProvided(){
  const existing = vm._provided
  const parentProvides = vm.$parent && vm.$parent._provided
  if (parentProvides === existing) {
    return (vm._provided = Object.create(parentProvides))
  } else {
    return existing
  }
}
```
#### 一些边界case
- initProp在处理prop时，特殊情况下会转化数据类型，需要留意下，避免出现不符合预期的结果
```ts
function validateProp(
  key: string,
  propOptions: Object,
  propsData: Object,
  vm?: Component
): any {
  const prop = propOptions[key]
  const absent = !hasOwn(propsData, key)
  let value = propsData[key]
  // getTypeIndex获取类型定义顺序，这里是0
  const booleanIndex = getTypeIndex(Boolean, prop.type)
  if (booleanIndex > -1) {
    if (absent && !hasOwn(prop, 'default')) {
      value = false
    } else if (value === '' || value === hyphenate(key)) {
      // 1.没有定义String类型
      // 2.Boolean定义的顺序在String之前
      // 3.符合1&2时，如果传入的是空字符串或者与键值key相同的值，会转化为true
      const stringIndex = getTypeIndex(String, prop.type)
      if (stringIndex < 0 || booleanIndex < stringIndex) {
        value = true
      }
    }
  }
}
```
#### 响应式原理
首先想想什么是响应式更新呢？jquery时代我们需要手动获取dom节点再绑定数据上去，如果数据发生变化，仍然需要我们手动去更新dom节点。如果我们可以在更新数据的同时自动去同步更新DOM节点，就减少了很多的心智负担，也让业务代码更加清晰，这就是响应式更新，我们只需要关注数据变化。  
那么要怎么实现响应式呢？要让视图自动跟随数据更新，那么自然要拿到所有绑定到视图的数据，一旦其中某个数据更新，就通知视图更新。在`vue`中实现这点的做法是通过`Object.defineProperty()`让数据作为依赖绑定到视图上。
##### 2.1 依赖收集
`Dep`是一个依赖管理类，`subs`管理所有保存当前依赖实例的上下文，如果依赖数据一旦变化，就会调用`notify()`方法通知上下文更新
```ts
class Dep{
  static target: DepTarget; // 作为收集依赖的上下文
  subs: DepTarget; // 保存当前依赖的上下文列表
  depend(){
    if(Dep.target){
      Dep.target.addDep(this)
    }
  }
  notify(){
    for(int i=0;i>this.subs.length;i++)
      this.subs.update()
  }
}
```
`DepTarget`可以看作是收集依赖的上下文，`deps`管理所有上下文里的所有依赖目标
```ts
class DepTarget{
  id: number
  deps: Dep[]
  addDep(dep: Dep){
    this.deps.push(dep)
  }
  update(){
    // 触发更新
  }
}
```
vue在`Object.defineProperty()`中收集依赖，然后在`$mount`绑定时会实例化一个`watcher`并设置为当前的依赖上下文，这样在render渲染视图时所有视图数据便会进入依赖收集流程。依赖收集完成后一旦数据变化，便会触发`vue._update`更新视图
```ts
const dep = new Dep()
Object.defineProperty(obj,key,{
  enumerable:true,
  configurable:true,
  get:()=>{
    if(Dep.target){
      // 如果对象被使用，那么就会作为依赖对象被添加到所处上下文中
      dep.depend()
    }
  },
  set:()=>{
    // 修改值的时候所有依赖此对象的地方会更新
    dep.notify()
  }
})
```
##### 2.2 Diff更新
现在已经实现了响应式更新视图，数据更新=》视图更新，但是现在数据和视图是整体绑定在一起的，任何一个数据的更新都会触发整个视图节点的变化，这在大型应用中显然是性能十分低下的。我们需要一种方法来智能实现视图的部分更新，这就是vue的diff算法，在diff过程中，会遍历整个dom树对比每个节点来找出需要更新的节点。  
那么可以分析下`patch`时的各种情况：
1. 旧节点为空  
  - 根节点初始化时，先清除真实DOM节点，再根据`VNode`创建新节点
  - 非根组件初始化时，因为`$el`为空，这种情况会直接创建新节点
2. 新节点为空  
   直接清空节点树，同时触发`Destroy`相关HooK
3. 旧节点和新节点都存在，但不是同一节点  
   清空旧节点，创建新节点
4. 旧节点和新节点相同  
   这种情况直接在旧节点上更新，先看是否要更新文本节点，然后遍历比较子节点树，这里就是Diff算法的应用。Diff算法有两个主要特点，首先是双端指向，就时在新旧节点树上都通过双指针指向子节点树的两头，然后来回遍历节点树，同时比较两棵树上的新节点与旧节点。另一个则是只比较同级节点，不会跨层级比较，如果一个节点相同，那么我们才会再去递归比较子节点。
   - 如果同一端节点相同，复用旧节点DOM，在旧节点上更新。
   - 如果首端节点和末端节点相同，说明节点位置倒转，仍然复用旧节点DOM，重新修改节点位置
   - 不同节点，此时再在旧节点树上通过当前节点的key查找
     - 找不到对应节点，则视为新节点直接新建
     - 找到对应节点，与当前节点对比是否为同一节点
       - 相同Key但不是同一节点，视为新节点
       - 是同一节点，则复用旧节点DOM
##### 2.3 模板编译
如果我们只用render API的方式来构建Vue组件，会需要函数形式构建大量的DOM节点，既不方便也不美观，所以vue提供`template`选项编译`render`函数
##### 2.4 SFC编译
Todo