// 主应用入口 - 布局与菜单切换
const { createApp, computed, ref } = Vue;

const app = createApp({
  setup() {
    const collapsed = ref(false);
    const activeMenu = ref('project');
    const menuTitleMap = {
      project: '项目信息',
      history: '历史运行',
      algorithm: '算法参数配置',
      strategy: '策略库',
      optimal: '最优策略'
    };
    const menuTitle = computed(() => menuTitleMap[activeMenu.value] || '');
    const handleMenuSelect = (key) => { activeMenu.value = key; };
    const currentPage = computed(() => {
      const map = {
        project: 'project-info-page',
        history: 'history-run-page',
        algorithm: 'algorithm-config-page',
        strategy: 'strategy-library-page',
        optimal: 'optimal-strategy-page'
      };
      return map[activeMenu.value];
    });
    return { collapsed, activeMenu, menuTitle, handleMenuSelect, currentPage };
  }
});

// 注册 Element Plus
app.use(ElementPlus);

// 注册图标
for (const [key, comp] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, comp);
}

// 注册页面组件（来自 window.PageComponents 注册表）
const PageComponents = window.PageComponents || {};
for (const [name, comp] of Object.entries(PageComponents)) {
  app.component(name, comp);
}

app.mount('#app');
