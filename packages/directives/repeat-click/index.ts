import { on, once } from '@element-plus/utils/dom'

import type { ObjectDirective } from 'vue'
// v-repeat-click 重复点击
export default {
  beforeMount(el, binding) {
    let interval = null//定时器
    let startTime: number//计时开始时间
    const handler = () => binding.value && binding.value()// 获取表达式内容（v-repeat-click="decrease" 拿到decrease方法）

    const clear = () => {
      // 如果当前时间距离开始时间少于 100ms，执行 handler
      if (Date.now() - startTime < 100) {
        handler()
      }
      clearInterval(interval)
      interval = null
    }
    // 绑定鼠标按下的事件
    on(el, 'mousedown', e => {
      if ((e as any).button !== 0) return//e.button
      startTime = Date.now()
      //监听鼠标抬起事件，只监听一次。
      // 监听的主体是document，而不是el，因为在点击的过程中，鼠标可能移除el区域在抬起。
      // 用once不用on的原因 是用on就会一直监听，在el外点击鼠标 也会执行clear函数。
      once(document as any, 'mouseup', clear)
      clearInterval(interval)
      interval = setInterval(handler, 100)
    })
  },
} as ObjectDirective

// e.button 一个数值，代表按下的鼠标按键：

// 0：主按键，通常指鼠标左键或默认值（译者注：如document.getElementById('a').click()这样触发就会是默认值）
// 1：辅助按键，通常指鼠标滚轮中键
// 2：次按键，通常指鼠标右键
// 3：第四个按钮，通常指浏览器后退按钮
// 4：第五个按钮，通常指浏览器的前进按钮
// 对于配置为左手使用的鼠标，按键操作将正好相反。此种情况下，从右至左读取值。
