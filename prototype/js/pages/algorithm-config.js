// 算法参数配置页面 - 7部分手风琴表单
window.PageComponents = window.PageComponents || {};

window.PageComponents['algorithm-config-page'] = {
  template: `
  <div class="page-card">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-select v-model="filters.algoType" placeholder="算法类型" clearable>
        <el-option v-for="o in algoTypeOpts" :key="o" :label="o" :value="o" />
      </el-select>
      <el-input v-model="filters.keyword" placeholder="配置编号/创建人" clearable @keyup.enter="onSearch" />
      <el-button type="primary" :icon="Search" @click="onSearch">搜索</el-button>
      <el-button :icon="RefreshLeft" @click="onReset">重置</el-button>
      <div class="spacer"></div>
      <el-button type="primary" :icon="Plus" @click="openCreate">创建算法参数配置</el-button>
    </div>

    <!-- 列表 -->
    <el-table :data="pagedData" border stripe>
      <el-table-column type="index" label="#" width="50" />
      <el-table-column prop="configNo" label="算法参数配置编号" min-width="160" />
      <el-table-column prop="algoType" label="算法类型" min-width="120" />
      <el-table-column prop="creator" label="创建人" min-width="100" />
      <el-table-column prop="createTime" label="创建时间" min-width="160" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <div class="table-ops">
            <el-button link type="primary" :icon="Edit" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" :icon="View" @click="openView(row)">查看</el-button>
            <el-button link type="danger" :icon="Delete" @click="onDelete(row)">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination-wrap">
      <el-pagination v-model:current-page="page.current" v-model:page-size="page.size"
        :total="filteredData.length" :page-sizes="[5,10,20,50]"
        layout="total, sizes, prev, pager, next, jumper" background />
    </div>

    <!-- 创建/编辑 弹窗（手风琴 7部分） -->
    <el-dialog v-model="formVisible" :title="formMode==='view'?'查看算法参数配置':(formMode==='edit'?'编辑算法参数配置':'创建算法参数配置')" width="1000px" top="5vh" :close-on-click-modal="false">
      <el-form :model="form" label-width="240px" :disabled="formMode==='view'">
        <el-row :gutter="16" style="margin-bottom:8px;">
          <el-col :span="12">
            <el-form-item label="算法参数配置编号">
              <el-input v-model="form.configNo" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="算法类型">
              <el-select v-model="form.algoType" placeholder="请选择" style="width:100%">
                <el-option v-for="o in algoTypeOpts" :key="o" :label="o" :value="o" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-collapse v-model="activeNames">
          <el-collapse-item v-for="sec in sections" :key="sec.name" :title="sec.title" :name="sec.name">
            <el-row :gutter="16">
              <el-col :span="12" v-for="f in sec.fields" :key="f.prop">
                <el-form-item :label="f.label">
                  <el-input v-if="f.type==='input'" v-model="form[f.prop]" />
                  <el-input-number v-else-if="f.type==='number'" v-model="form[f.prop]" :controls="false" style="width:100%" />
                  <el-select v-else-if="f.type==='select'" v-model="form[f.prop]" style="width:100%">
                    <el-option v-for="o in f.options" :key="o" :label="o" :value="o" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-collapse-item>
        </el-collapse>
      </el-form>
      <template #footer>
        <el-button @click="formVisible=false">关闭</el-button>
        <el-button v-if="formMode!=='view'" type="primary" @click="onSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
  `,
  setup() {
    const { ref, reactive, computed } = Vue;
    const Search = ElementPlusIconsVue.Search;
    const RefreshLeft = ElementPlusIconsVue.RefreshLeft;
    const Plus = ElementPlusIconsVue.Plus;
    const Edit = ElementPlusIconsVue.Edit;
    const View = ElementPlusIconsVue.View;
    const Delete = ElementPlusIconsVue.Delete;

    const algoTypeOpts = ['算法1', '优化算法', '负荷预测算法'];

    const sections = [
      {
        name: 'knnFilter', title: 'KNN筛选参数',
        fields: [
          { label: '冷负荷比对盲区权重', prop: 'coolLoadBlindWeight', type: 'number' },
          { label: '环境温度比对盲区权重', prop: 'envTempBlindWeight', type: 'number' },
          { label: '环境湿度比对盲区权重', prop: 'envHumidityBlindWeight', type: 'number' },
          { label: '供水温度比对盲区权重', prop: 'supplyTempBlindWeight', type: 'number' },
          { label: '流量比对盲区权重', prop: 'flowBlindWeight', type: 'number' },
          { label: '压差比对盲区权重', prop: 'pressureBlindWeight', type: 'number' }
        ]
      },
      {
        name: 'knnIter', title: 'KNN迭代参数',
        fields: [
          { label: 'KNN迭代最大次数', prop: 'knnMaxIter', type: 'number' },
          { label: 'KNN收敛阈值', prop: 'knnConvThreshold', type: 'number' },
          { label: 'KNN学习率', prop: 'knnLearningRate', type: 'number' },
          { label: 'KNN邻居数量', prop: 'knnNeighbors', type: 'number' },
          { label: 'KNN距离权重', prop: 'knnDistanceWeight', type: 'number' },
          { label: 'KNN相似度阈值', prop: 'knnSimThreshold', type: 'number' }
        ]
      },
      {
        name: 'correction', title: '修正参数（流量/压差/温度修正系数及迭代步长）',
        fields: [
          { label: '流量修正系数(用户侧最小流量随温度变化)', prop: 'flowCorrFactor', type: 'number' },
          { label: '压差修正系数(供回水压差随温度变化)', prop: 'pressureCorrFactor', type: 'number' },
          { label: '温度迭代步长(冷冻水出水温度搜索精度)', prop: 'tempIterStep', type: 'number' },
          { label: '修正系数1:压差修正(压差控制)', prop: 'pc_corr1_pressure', type: 'number' },
          { label: '修正系数2:温度修正(压差控制)', prop: 'pc_corr2_temperature', type: 'number' },
          { label: '修正系数3:回水温度修正(压差控制)', prop: 'pc_corr3_returnTemp', type: 'number' },
          { label: '修正系数4:湿度修正(压差控制)', prop: 'pc_corr4_humidity', type: 'number' },
          { label: '修正系数1:压差修正(温差控制)', prop: 'tc_corr1_pressure', type: 'number' },
          { label: '修正系数2:温度修正(温差控制)', prop: 'tc_corr2_temperature', type: 'number' },
          { label: '修正系数3:回水温度修正(温差控制)', prop: 'tc_corr3_returnTemp', type: 'number' },
          { label: '修正系数4:湿度修正(温差控制)', prop: 'tc_corr4_humidity', type: 'number' },
          { label: '修正系数1:回水温度修正(供水温度控制)', prop: 'st_corr1_returnTemp', type: 'number' },
          { label: '修正系数2:湿度修正(供水温度控制)', prop: 'st_corr2_humidity', type: 'number' },
          { label: '修正系数:冷却水温度修正(温差控制)', prop: 'tc_cwTempCorr', type: 'number' },
          { label: '安全裕度系数', prop: 'safetyMarginFactor', type: 'number' }
        ]
      },
      {
        name: 'rlExplore', title: 'RL探索参数',
        fields: [
          { label: '探索概率 ε-greedy(贪心策略概率)', prop: 'epsilonGreedy', type: 'number' },
          { label: '探索等待时长', prop: 'exploreWaitDuration', type: 'number' },
          { label: '动态探索-基础时间', prop: 'dynExploreBaseTime', type: 'number' },
          { label: '动态探索-每台主机增量', prop: 'dynExploreHostIncrement', type: 'number' },
          { label: '动态探索-最小时间', prop: 'dynExploreMinTime', type: 'number' },
          { label: '动态探索-最大时间', prop: 'dynExploreMaxTime', type: 'number' },
          { label: 'EER提升阈值(保存探索结果最低要求)', prop: 'eerImproveThreshold', type: 'number' },
          { label: '探索时间达标比例(保存前运行等待时长比例)', prop: 'exploreTimeRatio', type: 'number' },
          { label: '时间流逝比阈值', prop: 'timeElapseRatioThreshold', type: 'number' },
          { label: 'EER变化裕度(接受阈值)', prop: 'eerChangeMargin', type: 'number' }
        ]
      },
      {
        name: 'rlTrigger', title: 'RL触发参数',
        fields: [
          { label: '冷负荷变化触发阈值', prop: 'coolLoadTriggerThreshold', type: 'number' },
          { label: '温度变化触发阈值', prop: 'tempTriggerThreshold', type: 'number' },
          { label: '时间间隔触发阈值', prop: 'timeIntervalTriggerThreshold', type: 'number' },
          { label: 'EER下降触发阈值', prop: 'eerDropTriggerThreshold', type: 'number' },
          { label: '策略执行后触发标记', prop: 'postStrategyTriggerFlag', type: 'select', options: ['是', '否'] }
        ]
      },
      {
        name: 'safety', title: '安全修正参数',
        fields: [
          { label: '安全检查间隔', prop: 'safetyCheckInterval', type: 'number' },
          { label: '安全违规惩罚系数', prop: 'safetyViolationPenalty', type: 'number' },
          { label: '安全恢复因子', prop: 'safetyRecoveryFactor', type: 'number' },
          { label: '安全警告阈值', prop: 'safetyWarningThreshold', type: 'number' },
          { label: '紧急停止触发条件', prop: 'emergencyStopCondition', type: 'input' }
        ]
      },
      {
        name: 'qtable', title: 'Q-table离散化参数',
        fields: [
          { label: '冷负荷最小值', prop: 'coolLoadMin', type: 'number' },
          { label: '冷负荷最大值', prop: 'coolLoadMax', type: 'number' },
          { label: '冷负荷等分数', prop: 'coolLoadBins', type: 'number' },
          { label: '冷冻水供水温度最小值', prop: 'chwSupplyTempMin', type: 'number' },
          { label: '冷冻水供水温度最大值', prop: 'chwSupplyTempMax', type: 'number' },
          { label: '冷冻水供水温度等分数', prop: 'chwSupplyTempBins', type: 'number' },
          { label: '冷冻水流量最小值', prop: 'chwFlowMin', type: 'number' },
          { label: '冷冻水流量最大值', prop: 'chwFlowMax', type: 'number' },
          { label: '冷冻水流量等分数', prop: 'chwFlowBins', type: 'number' },
          { label: '压差最小值', prop: 'pressureMin', type: 'number' },
          { label: '压差最大值', prop: 'pressureMax', type: 'number' },
          { label: '压差等分数', prop: 'pressureBins', type: 'number' },
          { label: '环境温度最小值', prop: 'envTempMin', type: 'number' },
          { label: '环境温度最大值', prop: 'envTempMax', type: 'number' },
          { label: '环境温度等分数', prop: 'envTempBins', type: 'number' },
          { label: '环境湿度最小值', prop: 'envHumidityMin', type: 'number' },
          { label: '环境湿度最大值', prop: 'envHumidityMax', type: 'number' },
          { label: '环境湿度等分数', prop: 'envHumidityBins', type: 'number' }
        ]
      }
    ];

    const allFormFields = [{ label: '算法参数配置编号', prop: 'configNo', type: 'input' }, { label: '算法类型', prop: 'algoType', type: 'select' }];
    sections.forEach(s => s.fields.forEach(f => allFormFields.push(f)));

    const makeForm = () => { const o = { id: undefined }; allFormFields.forEach(f => o[f.prop] = null); return o; };

    const filters = reactive({ algoType: '', keyword: '' });
    const page = reactive({ current: 1, size: 10 });

    const tableData = ref([
      { id: 1, configNo: 'ALGO-CFG-001', algoType: '优化算法', creator: '张工', createTime: '2024-09-01 10:23' },
      { id: 2, configNo: 'ALGO-CFG-002', algoType: '负荷预测算法', creator: '李工', createTime: '2024-09-03 14:05' },
      { id: 3, configNo: 'ALGO-CFG-003', algoType: '算法1', creator: '王工', createTime: '2024-09-05 09:11' }
    ]);

    const filteredData = computed(() => tableData.value.filter(r => {
      if (filters.algoType && r.algoType !== filters.algoType) return false;
      if (filters.keyword) {
        const k = filters.keyword.toLowerCase();
        if (!((r.configNo||'').toLowerCase().includes(k) || (r.creator||'').toLowerCase().includes(k))) return false;
      }
      return true;
    }));
    const pagedData = computed(() => {
      const s = (page.current - 1) * page.size;
      return filteredData.value.slice(s, s + page.size);
    });

    const onSearch = () => { page.current = 1; };
    const onReset = () => { filters.algoType = ''; filters.keyword = ''; page.current = 1; };

    const formVisible = ref(false);
    const formMode = ref('create');
    const form = reactive(makeForm());
    const activeNames = ref(sections.map(s => s.name));

    const openCreate = () => { Object.assign(form, makeForm()); formMode.value = 'create'; formVisible.value = true; };
    const openEdit = (row) => { Object.assign(form, makeForm(), row); formMode.value = 'edit'; formVisible.value = true; };
    const openView = (row) => { Object.assign(form, makeForm(), row); formMode.value = 'view'; formVisible.value = true; };
    const onSubmit = () => {
      if (formMode.value === 'create') {
        const id = Math.max(0, ...tableData.value.map(r => r.id)) + 1;
        tableData.value.push({ ...form, id, creator: '当前用户', createTime: new Date().toLocaleString() });
        ElementPlus.ElMessage.success('创建成功');
      } else {
        const idx = tableData.value.findIndex(r => r.id === form.id);
        if (idx > -1) tableData.value[idx] = { ...form };
        ElementPlus.ElMessage.success('保存成功');
      }
      formVisible.value = false;
    };
    const onDelete = (row) => {
      ElementPlus.ElMessageBox.confirm('确认删除该算法参数配置？', '提示', { type: 'warning' })
        .then(() => {
          const idx = tableData.value.findIndex(r => r.id === row.id);
          if (idx > -1) tableData.value.splice(idx, 1);
          ElementPlus.ElMessage.success('删除成功');
        }).catch(() => {});
    };

    return {
      Search, RefreshLeft, Plus, Edit, View, Delete,
      algoTypeOpts, sections, filters, page, tableData, filteredData, pagedData,
      onSearch, onReset, formVisible, formMode, form, activeNames,
      openCreate, openEdit, openView, onSubmit, onDelete
    };
  }
};
