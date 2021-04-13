import { ref, computed, inject, WritableComputedRef } from 'vue'
import { elFormKey, elFormItemKey } from '@element-plus/form'
import { useGlobalConfig } from '@element-plus/utils/util'
import radioGroupKey from './token'

import type { ComputedRef } from 'vue'
import type { ElFormContext, ElFormItemContext } from '@element-plus/form'
import type { RadioGroupContext } from './token'

export const useRadio = () => {

  const ELEMENT = useGlobalConfig()
  const elForm = inject(elFormKey, {} as ElFormContext)
  const elFormItem = inject(elFormItemKey, {} as ElFormItemContext)
  const radioGroup = inject(radioGroupKey, {} as RadioGroupContext)
  const focus = ref(false)//控制focus样式 click时，不显示focus样式
  const isGroup = computed(() => radioGroup?.name === 'ElRadioGroup')
  const elFormItemSize = computed(() => elFormItem.size || ELEMENT.size)

  return {
    isGroup,
    focus,
    radioGroup,
    elForm,
    ELEMENT,
    elFormItemSize,
  }
}

interface IUseRadioAttrsProps {
  disabled?: boolean
  label: string | number | boolean
}

interface IUseRadioAttrsState {
  isGroup: ComputedRef<boolean>
  radioGroup: RadioGroupContext
  elForm: ElFormContext
  model: WritableComputedRef<string | number | boolean>
}

export const useRadioAttrs = (props: IUseRadioAttrsProps, {
  isGroup,
  radioGroup,
  elForm,
  model,
}: IUseRadioAttrsState) => {
  const isDisabled = computed(() => {
    return isGroup.value
      ? radioGroup.disabled || props.disabled || elForm.disabled
      : props.disabled || elForm.disabled
  })
  // - tabindex=负值 (通常是tabindex=“-1”)，表示元素是可聚焦的，但是不能通过键盘导航来访问到该元素，用JS做页面小组件内部键盘导航的时候非常有用。
  // - `tabindex="0"` ，表示元素是可聚焦的，并且可以通过键盘导航来聚焦到该元素，它的相对顺序是当前处于的DOM结构来决定的。
  // - tabindex=正值，表示元素是可聚焦的，并且可以通过键盘导航来访问到该元素；它的相对顺序**按照**tabindex 的数值`递增而滞后获焦 `。如果多个元素拥有相同的 **tabindex**，它们的相对顺序按照他们在当前DOM中的先后顺序决定。
  const tabIndex = computed(() => {
    return (isDisabled.value || (isGroup.value && model.value !== props.label)) ? -1 : 0
  })

  return {
    isDisabled,
    tabIndex,
  }

}
