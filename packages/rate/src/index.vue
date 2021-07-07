<template>
  <!-- 最外层 可以通过tab 进行切换，通过 上下左右键 进行数值的加减 -->
  <div
    class="el-rate"
    role="slider"
    :aria-valuenow="currentValue"
    :aria-valuetext="text"
    aria-valuemin="0"
    :aria-valuemax="max"
    tabindex="0"
    @keydown="handleKey"
  >
    <!-- v-for 每个星星上 通过 移动时/离开 控制加减 -->
    <!-- mouseleave 不会冒泡 -->
    <span
      v-for="(item, key) in max"
      :key="key"
      class="el-rate__item"
      :style="{ cursor: rateDisabled ? 'auto' : 'pointer' }"
      @mousemove="setCurrentValue(item, $event)"
      @mouseleave="resetCurrentValue"
      @click="selectValue(item)"
    >
      <!-- hover样式 el-rate__icon.hover{ transform: scale(1.15)} -->
      <!-- classes[item - 1] 控制当前图标样式 -->
      <!-- getIconStyle(item) 控制当前图标颜色 -->
      <i
        :class="[classes[item - 1], { 'hover': hoverIndex === item }]"
        class="el-rate__icon"
        :style="getIconStyle(item)"
      >
        <!-- 小数图标显示 showDecimalIcon:true/false-->
        <i
          v-if="showDecimalIcon(item)"
          :class="decimalIconClass"
          :style="decimalStyle"
          class="el-rate__decimal"
        >
        </i>
      </i>
    </span>
    <!-- 显示辅助文字或者分数 -->
    <span v-if="showText || showScore" class="el-rate__text" :style="{ color: textColor }">{{ text }}</span>
  </div>
</template>
<script lang='ts'>
import {
  defineComponent,
  inject,
  computed,
  ref,
  watch,
  PropType,
} from 'vue'
import { isObject, isArray } from '@vue/shared'
import { hasClass } from '@element-plus/utils/dom'
import { EVENT_CODE } from '@element-plus/utils/aria'
import { elFormKey } from '@element-plus/form'

import type { ElFormContext } from '@element-plus/form'

export default defineComponent({
  name: 'ElRate',
  props: {
    modelValue: {
      type: Number,
      default: 0,
    },
    //低分和中等分数的界限值，值本身被划分在低分中
    lowThreshold: {
      type: Number,
      default: 2,
    },
    //高分和中等分数的界限值，值本身被划分在高分中
    highThreshold: {
      type: Number,
      default: 4,
    },
    //最大分值
    max: {
      type: Number,
      default: 5,
    },
    // 未选中 icon 的颜色
    colors: {
      type: [Array, Object],
      default: () => ['#F7BA2A', '#F7BA2A', '#F7BA2A'],
    },
    //未选中 icon 的颜色
    voidColor: {
      type: String,
      default: '#C6D1DE',
    },
    //只读时未选中 icon 的颜色
    disabledVoidColor: {
      type: String,
      default: '#EFF2F7',
    },
    //icon 的类名。若传入数组，共有 3 个元素，为 3 个分段所对应的类名；若传入对象，可自定义分段，键名为分段的界限值，键值为对应的类名
    iconClasses: {
      type: [Array, Object],
      default: () => ['el-icon-star-on', 'el-icon-star-on', 'el-icon-star-on'],
    },
    //未选中 icon 的类名
    voidIconClass: {
      type: String,
      default: 'el-icon-star-off',
    },
    //只读时未选中 icon 的类名
    disabledVoidIconClass: {
      type: String,
      default: 'el-icon-star-on',
    },
    //是否为只读
    disabled: {
      type: Boolean,
      default: false,
    },
    //是否允许半选
    allowHalf: {
      type: Boolean,
      default: false,
    },
    //是否显示辅助文字，若为真，则会从 texts 数组中选取当前分数对应的文字内容
    showText: {
      type: Boolean,
      default: false,
    },
    //是否显示当前分数，show-score 和 show-text 不能同时为真
    showScore: {
      type: Boolean,
      default: false,
    },
    //辅助文字的颜色
    textColor: {
      type: String,
      default: '#1f2d3d',
    },
    //辅助文字数组 ['极差', '失望', '一般', '满意', '惊喜']
    texts: {
      type: Array as PropType<string[]>,
      default: () => ['Extremely bad','Disappointed','Fair','Satisfied','Surprise'],
    },
    //分数显示模板
    scoreTemplate: {
      type: String,
      default: '{value}',
    },
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const elForm = inject(elFormKey, {} as ElFormContext)
    // 当前值
    const currentValue = ref(props.modelValue)
    // 禁用状态
    const rateDisabled = computed(() => props.disabled || elForm.disabled)
    // 显示辅助文字或者分数
    const text = computed(() => {
      let result = ''
      //显示分数
      if (props.showScore) {
        //分数 通过分数模版进行替换 {value}  { value }
        result = props.scoreTemplate.replace(
          /\{\s*value\s*\}/,
          rateDisabled.value
            ? `${props.modelValue}`
            : `${currentValue.value}`,
        )
      } else if (props.showText) {
        //显示辅助文本 Math.ceil向上取整
        result = props.texts[Math.ceil(currentValue.value) - 1]
      }
      return result
    })

    function getValueFromMap(value: unknown, map: Record<string, unknown>) {
      const matchedKeys = Object.keys(map)
        .filter(key => {
          const val = map[key]
          const excluded = isObject(val) ? val.excluded : false//排除
          return excluded ? value < key : value <= key// 如果排除 就不包含当前
        })
        .sort((a: never, b: never) => a - b)
      const matchedValue = map[matchedKeys[0]]
      return isObject(matchedValue) ? matchedValue.value : (matchedValue || '')
    }
    //数值的小数部分 3.75 => 75
    const valueDecimal = computed(() => props.modelValue * 100 - Math.floor(props.modelValue) * 100)
    //colorMap 如果是数组，根据 阶段 返回{2:colors[0],4:{...},5:colors[2]}
    const colorMap = computed(() => isArray(props.colors)
      ? {
        [props.lowThreshold]: props.colors[0],
        [props.highThreshold]: { value: props.colors[1], excluded: true },
        [props.max]: props.colors[2],
      } : props.colors,
    )
    //根据当前值，返回对应的颜色
    const activeColor = computed(() => getValueFromMap(currentValue.value, colorMap.value))
    //小数时的样式 —— 禁用时显示具体小数，非禁用50%
    const decimalStyle = computed(() => {
      let width = ''
      if (rateDisabled.value) {
        width = `${ valueDecimal.value }%`
      } else if (props.allowHalf) {
        width = '50%'
      }
      return {
        color: activeColor.value,
        width,
      }
    })


    //classMap 根据分界线显示 对应的图标
    const classMap = computed(() => isArray(props.iconClasses)
      ? {
        [props.lowThreshold]: props.iconClasses[0],// 低/中 分界
        [props.highThreshold]: { value: props.iconClasses[1], excluded: true },// 中/高 分界
        [props.max]: props.iconClasses[2], //最大
      } : props.iconClasses,
    )
    //根据当前值 返回对应的图标
    const decimalIconClass = computed(() => getValueFromMap(props.modelValue, classMap.value))
    //空心图标 ☆
    const voidClass = computed(() => rateDisabled.value ? props.disabledVoidIconClass : props.voidIconClass)
    //active图标 ⭐︎
    const activeClass = computed(() => getValueFromMap(currentValue.value, classMap.value))
    //classes 返回icon数组，通过classMap判断当前值所在区域（低中高），获取对应的icon
    const classes = computed(() => {
      let result = Array(props.max)
      let threshold = currentValue.value
      // if (props.allowHalf && currentValue.value !== Math.floor(currentValue.value)) {
      //   threshold--
      // }
      // fill(填充值，开始索引，结束索引) 如果索引值为小数，自动向下取整。
      result.fill(activeClass.value, 0, threshold)
      result.fill(voidClass.value, threshold, props.max)
      // ["el-icon-star-on", "el-icon-star-on", "el-icon-star-off", "el-icon-star-off", "el-icon-star-off"]
      // [⭐︎,⭐︎,☆,☆,☆]
      return result
    })


    //左半边指针
    const pointerAtLeftHalf = ref(true)
    watch(() => props.modelValue, val => {
      currentValue.value = val
      pointerAtLeftHalf.value = props.modelValue !== Math.floor(props.modelValue) //只要是小数的情况，就是ture
    })
    //是否显示小数图标
    function showDecimalIcon(item: number) {
      let showWhenDisabled = rateDisabled.value && valueDecimal.value > 0 && item - 1 < props.modelValue && item > props.modelValue
      /* istanbul ignore next */
      let showWhenAllowHalf = props.allowHalf &&
        pointerAtLeftHalf.value &&
        item - 0.5 <= currentValue.value &&
        item > currentValue.value
      return showWhenDisabled || showWhenAllowHalf
    }
    //颜色填充
    function getIconStyle(item: number) {
      //空心色
      const voidColor = rateDisabled.value ? props.disabledVoidColor : props.voidColor
      return {
        color: item <= currentValue.value ? activeColor.value : voidColor,// 实心 or 空心
      }
    }
    //click 时，修改值
    function selectValue(value: number) {
      if (rateDisabled.value) {
        return
      }
      if (props.allowHalf && pointerAtLeftHalf.value) {
        emit('update:modelValue', currentValue.value)
        emit('change', this.currentValue)
      } else {
        emit('update:modelValue', value)
        emit('change', value)
      }
    }
    // ⬆️⬇️⬅️➡️
    function handleKey(e: KeyboardEvent) {
      if (rateDisabled.value) {
        return
      }
      let _currentValue = currentValue.value
      const code = e.code
      if (code === EVENT_CODE.up || code === EVENT_CODE.right) {
        //➕
        if (props.allowHalf) {
          _currentValue += 0.5
        } else {
          _currentValue += 1
        }
        e.stopPropagation()//禁止冒泡
        e.preventDefault()//禁止默认行为
      } else if (code === EVENT_CODE.left || code === EVENT_CODE.down) {
        //➖
        if (props.allowHalf) {
          _currentValue -= 0.5
        } else {
          _currentValue -= 1
        }
        e.stopPropagation()
        e.preventDefault()
      }
      //边界判断 0 max
      _currentValue = _currentValue < 0 ? 0 : _currentValue
      _currentValue = _currentValue > props.max ? props.max : _currentValue
      emit('update:modelValue', _currentValue)
      emit('change', _currentValue)
      return _currentValue //为什么要return出来，好像没有必要吧❓
    }
    //hover样式
    const hoverIndex = ref(-1)
    //mousemove->绑定在el-rate__item 通过移动来实现当前值的变化 但是不会修改值
    function setCurrentValue(value: number, event: MouseEvent) {
      if (rateDisabled.value) {
        return
      }
      /* istanbul ignore if */
      if (props.allowHalf) {
        // target 变化前            target.clientWidth
        //左：el-rate__decimal 1     9
        //中：el-rate__icon    2     18
        //右：el-rate__item    3     24
        let target = event.target as HTMLElement
        if (hasClass(target, 'el-rate__item')) {//右侧 3
          target = target.querySelector('.el-rate__icon')
          // console.warn('target 3')
        }
        if (hasClass(target, 'el-rate__decimal')) {//左侧 1
          target = target.parentNode as HTMLElement
          // console.warn('target 1')
        }
        //target 变化后
        //左：el-rate__decimal 1  ==> el-rate__icon  18
        //中：el-rate__icon    2  ==> el-rate__icon  18
        //右：el-rate__item    3  ==> el-rate__icon  18

        //其实就是将target指向 el-rate__icon 其clientWidth=18(默认值 $--rate-icon-size)
        //
        pointerAtLeftHalf.value = event.offsetX * 2 <= target.clientWidth // 左半边指针 状态
        currentValue.value = pointerAtLeftHalf.value ? value - 0.5 : value
      } else {
        currentValue.value = value
      }
      hoverIndex.value = value
    }
    //mouseleave 鼠标离开时，当前值恢复成 modelValue
    function resetCurrentValue() {
      if (rateDisabled.value) {
        return
      }
      if (props.allowHalf) {
        pointerAtLeftHalf.value = props.modelValue !== Math.floor(props.modelValue)
      }
      currentValue.value = props.modelValue
      hoverIndex.value = -1
    }
    //初始化 时 如果没有 modelValue，设置为0
    if (!props.modelValue) {
      emit('update:modelValue', 0)
    }
    return {
      hoverIndex,

      currentValue,
      rateDisabled,
      text,
      decimalStyle,
      decimalIconClass,
      classes,

      showDecimalIcon,
      getIconStyle,
      selectValue,
      handleKey,
      setCurrentValue,
      resetCurrentValue,
    }
  },
})
</script>
