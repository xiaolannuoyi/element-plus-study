import {
  defineComponent,
  h,
  ref,
  computed,
  watch,
  provide,
} from 'vue'
import { IPagination } from './pagination'

import Prev from './prev.vue'
import Next from './next.vue'
import Sizes from './sizes.vue'
import Jumper from './jumper.vue'
import Total from './total.vue'
import Pager from './pager.vue'

const getValidPageSize = (val: number) => Number.isNaN(val) ? 10 : val

export default defineComponent({
  name: 'ElPagination',

  components: {
    Prev,
    Next,
    Sizes,
    Jumper,
    Total,
    Pager,
  },
  props: {
    //每页显示条目个数，支持 v-model 双向绑定
    pageSize: {
      type: Number,
      default: 10,
    },
    //是否使用小型分页样式
    small: Boolean,
    //总条目数
    total: {
      type: Number,
    },
    //总页数，total 和 page-count 设置任意一个就可以达到显示页码的功能；
    //如果要支持 page-sizes 的更改，则需要使用 total 属性
    pageCount: {
      type: Number,
    },
    //页码按钮的数量，当总页数超过该值时会折叠
    pagerCount: {
      type: Number,
      validator: (value: number) => {
        return (
          (value | 0) === value && value > 4 && value < 22 && value % 2 === 1
        )
      },
      default: 7,
    },
    //当前页数，支持 v-model 双向绑定
    currentPage: {
      type: Number,
      default: 1,
    },

    layout: {
      type: String,
      default: 'prev, pager, next, jumper, ->, total',
    },
    // 每页个数下拉
    pageSizes: {
      type: Array,
      default: () => {
        return [10, 20, 30, 40, 50, 100]
      },
    },

    popperClass: {
      type: String,
      default: '',
    },

    prevText: {
      type: String,
      default: '',
    },

    nextText: {
      type: String,
      default: '',
    },
    // 是否为分页按钮添加背景色
    background: Boolean,

    disabled: Boolean,
    //只有一页时是否隐藏
    hideOnSinglePage: Boolean,
  },

  emits: [
    'size-change',
    'current-change',
    'prev-click',
    'next-click',
    'update:currentPage',
    'update:pageSize',
  ],
  setup(props, { emit }) {
    const lastEmittedPage = ref(-1)//最后emit的页码
    const userChangePageSize = ref(false)
    const internalPageSize = ref(getValidPageSize(props.pageSize))//内部每页显示条目个数

    const internalPageCount = computed<Nullable<number>>(() => {
      if (typeof props.total === 'number') {
        return Math.max(1, Math.ceil(props.total / internalPageSize.value))
      } else if (typeof props.pageCount === 'number') {
        return Math.max(1, props.pageCount)
      }
      return null
    })
    //内部当前页面
    const internalCurrentPage = ref(getValidCurrentPage(props.currentPage))

    function emitChange() {
      //不是同一个页码的情况时 或 用户更改
      console.warn('===',internalCurrentPage.value !== lastEmittedPage.value ,
        userChangePageSize.value)

      if (
        internalCurrentPage.value !== lastEmittedPage.value ||
        userChangePageSize.value
      ) {
        lastEmittedPage.value = internalCurrentPage.value
        userChangePageSize.value = false
        emit('update:currentPage', internalCurrentPage.value)//currentPage
        emit('current-change', internalCurrentPage.value)//触发current-change事件
      }
    }
    // Pager组件中 触发
    // if (newPage !== currentPage) {
    //   emit('change', newPage)
    // }
    // 已经对 是否同一页 做了处理，所以能触发 必是 internalCurrentPage.value !== lastEmittedPage.value
    // userChangePageSize.value  好像是没有必要的。
    function handleCurrentChange(val: number) {
      internalCurrentPage.value = getValidCurrentPage(val)
      userChangePageSize.value = true
      emitChange()
    }
    //sizes 组件中  修改了每页条数
    function handleSizesChange(val: number) {
      userChangePageSize.value = true
      internalPageSize.value = val
      emit('update:pageSize', val)
      emit('size-change', val)
    }
    //上一页
    function prev() {
      if (props.disabled) return
      const newVal = internalCurrentPage.value - 1
      internalCurrentPage.value = getValidCurrentPage(newVal)
      emit('prev-click', internalCurrentPage.value)
      emitChange()
    }

    function next() {
      if (props.disabled) return
      const newVal = internalCurrentPage.value + 1
      internalCurrentPage.value = getValidCurrentPage(newVal)
      emit('next-click', internalCurrentPage.value)
      emitChange()
    }

    function getValidCurrentPage(value: number | string) {
      if (typeof value === 'string') {
        value = parseInt(value, 10)
      }
      let resetValue: number | undefined
      const havePageCount = typeof internalPageCount.value === 'number'

      if (!havePageCount) {
        if (isNaN(value) || value < 1) resetValue = 1
      } else {
        if (value < 1) {
          resetValue = 1
        } else if (value > internalPageCount.value) {
          resetValue = internalPageCount.value
        }
      }

      if (resetValue === undefined && isNaN(value)) {
        resetValue = 1
      } else if (resetValue === 0) {
        resetValue = 1
      }

      return resetValue === undefined ? value : resetValue
    }

    watch(() => props.currentPage, val => {
      internalCurrentPage.value = getValidCurrentPage(val)
    })

    watch(() => props.pageSize, val => {
      internalPageSize.value = getValidPageSize(val)
    })

    watch(
      () => internalPageCount.value,
      val => {
        const oldPage = internalCurrentPage.value
        if (val > 0 && oldPage === 0) {
          internalCurrentPage.value = 1
        } else if (oldPage > val) {
          internalCurrentPage.value = val === 0 ? 1 : val
          emitChange()
        }
      },
    )

    provide<IPagination>('pagination', {
      pageCount: computed(() => props.pageCount),
      disabled: computed(() => props.disabled),
      currentPage: computed(() => internalCurrentPage.value),
      changeEvent: handleCurrentChange,
      handleSizesChange,
    })

    return {
      internalCurrentPage,
      internalPageSize,
      lastEmittedPage,
      userChangePageSize,
      internalPageCount,

      getValidCurrentPage,
      emitChange,
      handleCurrentChange,

      prev,
      next,
    }
  },
  render() {
    const layout = this.layout

    if (!layout) return null
    if (
      this.hideOnSinglePage &&
      (!this.internalPageCount || this.internalPageCount === 1)
    )
      return null
    //<div class="el-pagination is-background ..."></div>
    const rootNode = h('div', {
      class: [
        'el-pagination',
        {
          'is-background': this.background,
          'el-pagination--small': this.small,
        },
      ],
    })
    const rootChildren = []
    const rightWrapperChildren = []
    //右侧间距 -> 在layout中使用‘->’ 其右侧的内容 会靠右侧对齐 float：right
    const rightWrapperRoot = h('div', { class: 'el-pagination__rightwrapper' }, rightWrapperChildren)
    const TEMPLATE_MAP = {
      prev: h(Prev, {
        disabled: this.disabled,
        currentPage: this.internalCurrentPage,
        prevText: this.prevText,
        onClick: this.prev,
      }),
      jumper: h(Jumper),
      pager: h(Pager, {
        currentPage: this.internalCurrentPage,
        pageCount: this.internalPageCount,
        pagerCount: this.pagerCount,
        onChange: this.handleCurrentChange,
        disabled: this.disabled,
      }),
      next: h(Next, {
        disabled: this.disabled,
        currentPage: this.internalCurrentPage,
        pageCount: this.internalPageCount,
        nextText: this.nextText,
        onClick: this.next,
      }),
      sizes: h(Sizes, {
        pageSize: this.pageSize,
        pageSizes: this.pageSizes,
        popperClass: this.popperClass,
        disabled: this.disabled,
      }),
      slot: this.$slots?.default?.() ?? null,
      total: h(Total, { total: this.total }),
    }

    const components = layout.split(',').map((item: string) => item.trim())

    let haveRightWrapper = false
    //遍历components , 遇到->后 让后面的组件都放入到rightWrapperChildren中
    components.forEach((c: keyof typeof TEMPLATE_MAP | '->') => {
      if (c === '->') {
        haveRightWrapper = true
        return
      }
      if (!haveRightWrapper) {
        rootChildren.push(TEMPLATE_MAP[c])
      } else {
        rightWrapperChildren.push(TEMPLATE_MAP[c])
      }
    })
    // 当有 -> 标识时，且rightWrapperChildren > 0
    if (haveRightWrapper && rightWrapperChildren.length > 0) {
      rootChildren.unshift(rightWrapperRoot)//push 也可以吧
    }

    return h(rootNode, {}, rootChildren)
  },
})
