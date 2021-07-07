<template>
  <ul class="el-pager" @click="onPagerClick">
    <!-- 第一页 -->
    <li
      v-if="pageCount > 0"
      :class="{ active: currentPage === 1, disabled }"
      class="number"
    >
      1
    </li>
    <!-- showPrevMore  mouseenter时展示⬅，mouseleave时展示•••-->
    <li
      v-if="showPrevMore"
      class="el-icon more btn-quickprev"
      :class="[quickprevIconClass, { disabled }]"
      @mouseenter="onMouseenter('left')"
      @mouseleave="quickprevIconClass = 'el-icon-more'"
    >
    </li>
    <!-- 遍历 -->
    <li
      v-for="pager in pagers"
      :key="pager"
      :class="{ active: currentPage === pager, disabled }"
      class="number"
    >
      {{ pager }}
    </li>
    <!-- showNextMore  mouseenter时展示➡️，mouseleave时展示•••-->
    <li
      v-if="showNextMore"
      class="el-icon more btn-quicknext"
      :class="[quicknextIconClass, { disabled }]"
      @mouseenter="onMouseenter('right')"
      @mouseleave="quicknextIconClass = 'el-icon-more'"
    >
    </li>
    <!-- 最后一页 -->
    <li
      v-if="pageCount > 1"
      :class="{ active: currentPage === pageCount, disabled }"
      class="number"
    >
      {{ pageCount }}
    </li>
  </ul>
</template>
<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  watchEffect,
} from 'vue'

export default defineComponent({
  name: 'ElPager',
  props: {
    currentPage: {
      type: Number,
      default: 1,
    },
    pageCount: {
      type: Number,
    },
    pagerCount: {
      type: Number,
      default: 7,
    },
    disabled: Boolean,
  },
  emits: ['change'],
  setup(props, { emit }) {
    const showPrevMore = ref(false)
    const showNextMore = ref(false)
    const quicknextIconClass = ref('el-icon-more')
    const quickprevIconClass = ref('el-icon-more')
    // pagers 用于v-for
    const pagers = computed(() => {
      const pagerCount = props.pagerCount //页码按钮个数
      const halfPagerCount = (pagerCount - 1) / 2 //pagerCount 为奇数的目的是 用于判断 当前页所在的区间范围
      const currentPage = Number(props.currentPage)
      const pageCount = Number(props.pageCount)//总页数

      let showPrevMore = false
      let showNextMore = false
      //总页数 > 页码按钮数量
      if (pageCount > pagerCount) {
        //判断当前页在 哪个区间
        // 当前页 和 前区间（pagerCount 按钮数量 - halfPagerCount）比较
        if (currentPage > pagerCount - halfPagerCount) {
          showPrevMore = true
          console.warn('pre')
        }
        // 当前页 和 后区间（pageCount 总页数- halfPagerCount）比较
        if (currentPage < pageCount - halfPagerCount) {
          showNextMore = true
          console.warn('next')
        }
      }
      const array = []
      // 四种情况
      // ✅pre  ❌next
      // ❌pre  ✅next
      // ✅pre  ✅next
      // ❌pre  ❌next
      if (showPrevMore && !showNextMore) {
        // 1 ••• 5 6 7 8 9 10
        //array 5 6 7 8 9
        const startPage = pageCount - (pagerCount - 2)//2 为首页，尾页
        for (let i = startPage; i < pageCount; i++) {
          array.push(i)
        }
      } else if (!showPrevMore && showNextMore) {
        //1 2 3 4 5 6 ••• 10
        //array 2 3 4 5 6
        for (let i = 2; i < pagerCount; i++) {
          array.push(i)
        }
      } else if (showPrevMore && showNextMore) {
        //1 ••• 3 4 5 6 7 ••• 10
        //1 ••• 4 5 6 7 8 ••• 10
        //【-offset ， offset】
        const offset = Math.floor(pagerCount / 2) - 1
        for (let i = currentPage - offset; i <= currentPage + offset; i++) {
          array.push(i)
        }
      } else {
        for (let i = 2; i < pageCount; i++) {
          array.push(i)
        }
      }

      return array
    })

    watchEffect(() => {
      const halfPagerCount = (props.pagerCount - 1) / 2

      showPrevMore.value = false
      showNextMore.value = false

      if (props.pageCount > props.pagerCount) {
        if (props.currentPage > props.pagerCount - halfPagerCount) {
          showPrevMore.value = true
        }
        if (props.currentPage < props.pageCount - halfPagerCount) {
          showNextMore.value = true
        }
      }
    })

    watchEffect(() => {
      if(!showPrevMore.value) quickprevIconClass.value = 'el-icon-more'
    })
    watchEffect(() => {
      if(!showNextMore.value) quicknextIconClass.value = 'el-icon-more'
    })

    function onMouseenter(direction: 'left' | 'right') {
      if (props.disabled) return
      if (direction === 'left') {
        quickprevIconClass.value = 'el-icon-d-arrow-left'
      } else {
        quicknextIconClass.value = 'el-icon-d-arrow-right'
      }
    }
    // 使用了  事件代理-冒泡原理
    function onPagerClick(event: UIEvent) {
      const target = event.target as HTMLElement
      if (target.tagName.toLowerCase() === 'ul' || props.disabled) {
        return
      }

      let newPage = Number(target.textContent)
      console.log('newPage',newPage)

      const pageCount = props.pageCount//总页数
      const currentPage = props.currentPage//当前页
      const pagerCountOffset = props.pagerCount - 2//页码按钮的位移量
      //如果按钮是 showPreMore 或者 showNextMore 按钮
      if (target.className.includes('more')) {
        if (target.className.includes('quickprev')) {
          newPage = currentPage - pagerCountOffset//左移
        } else if (target.className.includes('quicknext')) {
          newPage = currentPage + pagerCountOffset//右移
        }
      }
      //左移 右移后的边界问题
      if (!isNaN(newPage)) {
        if (newPage < 1) {
          newPage = 1
        }
        if (newPage > pageCount) {
          newPage = pageCount
        }
      }
      //emit
      if (newPage !== currentPage) {
        emit('change', newPage)
      }
    }

    return {
      showPrevMore,
      showNextMore,
      quicknextIconClass,
      quickprevIconClass,
      pagers,
      onMouseenter,
      onPagerClick,
    }
  },
})
</script>
