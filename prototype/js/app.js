// 主应用入口 - 布局与菜单切换
const { createApp, computed, ref } = Vue;

const app = createApp({
  template: `
    <el-container style="height:100%;">
      <el-aside class="layout-aside" :width="collapsed ? '64px' : '220px'">
        <div class="layout-logo">{{ collapsed ? '冷源' : '建筑冷源优化平台' }}</div>
        <el-menu
          :default-active="activeMenu"
          :collapse="collapsed"
          background-color="#001529"
          text-color="#bfc7d2"
          active-text-color="#fff"
          @select="handleMenuSelect"
        >
          <el-menu-item index="project">
            <el-icon><Document /></el-icon>
            <template #title>项目信息</template>
          </el-menu-item>
          <el-menu-item index="history">
            <el-icon><Histogram /></el-icon>
            <template #title>历史运行</template>
          </el-menu-item>
          <el-menu-item index="algorithm">
            <el-icon><Setting /></el-icon>
            <template #title>算法参数配置</template>
          </el-menu-item>
          <el-menu-item index="strategy">
            <el-icon><Files /></el-icon>
            <template #title>策略库</template>
          </el-menu-item>
          <el-menu-item index="optimal">
            <el-icon><Trophy /></el-icon>
            <template #title>最优策略</template>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header class="layout-header">
          <el-button text @click="collapsed = !collapsed">
            <el-icon size="20"><Fold v-if="!collapsed" /><Expand v-else /></el-icon>
          </el-button>
          <h2>{{ menuTitle }}</h2>
        </el-header>
        <el-main class="layout-main">
          <component :is="currentPage"></component>
        </el-main>
      </el-container>
    </el-container>
  `,
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

// 挂载，并捕获任何运行期错误，直接显示在页面上
try {
  app.mount('#app');
  // 挂载成功，隐藏启动诊断状态条（保留 boot-error 作为兜底，仅在出错时显示）
  var st = document.getElementById('boot-status');
  if (st) st.style.display = 'none';
} catch (e) {
  if (window.__bootShowErr) window.__bootShowErr('app.mount 失败: ' + (e && e.stack ? e.stack : e));
}

// Vue 运行期错误捕获
app.config.errorHandler = (err, instance, info) => {
  if (window.__bootShowErr) window.__bootShowErr('Vue 运行错误: ' + (err && err.stack ? err.stack : err) + '\n信息: ' + info);
};
