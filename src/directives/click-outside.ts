import type { Directive } from 'vue'

interface ExtendedHTMLElement extends HTMLElement {
  _clickOutside?: (event: Event) => void
}

export const vClickOutside: Directive = {
  mounted(el: ExtendedHTMLElement, binding) {
    el._clickOutside = (event: Event) => {
      // 使用 event.composedPath() 来获取事件路径
      const path = event.composedPath()
      const addButton = document.querySelector('.add-button')
      const inputArea = document.querySelector('.input-area')
      
      // 如果点击的是按钮或输入区域或其子元素，不触发点击外部事件
      if ((addButton && path.includes(addButton)) || 
          (inputArea && path.includes(inputArea))) {
        return
      }
      
      // 如果点击的是当前元素或其子元素，不触发点击外部事件
      if (el === event.target || el.contains(event.target as Node)) {
        return
      }
      
      // 触发点击外部事件
      binding.value(event)
    }
    document.body.addEventListener('click', el._clickOutside, true)
  },
  unmounted(el: ExtendedHTMLElement) {
    if (el._clickOutside) {
      document.body.removeEventListener('click', el._clickOutside, true)
      delete el._clickOutside
    }
  }
}
