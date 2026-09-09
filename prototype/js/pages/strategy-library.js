// 策略库页面
window.PageComponents = window.PageComponents || {};

window.PageComponents['strategy-library-page'] = {
  template: `
  <div class="page-card">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-select v-model="filters.source" placeholder="策略来源" clearable>
        <el-option v-for="o in sourceOpts" :key="o" :label="o" :value="o" />
      </el-select>
      <el-select v-model="filters.strategyType" placeholder="策略类型" clearable>
        <el-option v-for="o in strategyTypeOpts" :key="o" :label="o" :value="o" />
      </el-select>
      <el-input v-model="filters.keyword" placeholder="策略编号/所属项目" clearable @keyup.enter="onSearch" />
      <el-button type="primary" :icon="Search" @click="onSearch">搜索</el-button>
      <el-button :icon="RefreshLeft" @click="onReset">重置</el-button>
      <div class="spacer"></div>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增策略</el-button>
      <el-button :icon="Download" @click="onTemplate">模版下载</el-button>
      <el-upload :show-file-list="false" :before-upload="onImport" accept=".xlsx,.xls,.csv">
        <el-button :icon="Upload">导入策略</el-button>
      </el-upload>
      <el-button type="success" :icon="MagicStick" @click="openAlgoGen">算法生成策略</el-button>
    </div>

    <!-- 列表 -->
    <el-table :data="pagedData" border stripe>
      <el-table-column type="index" label="#" width="50" />
      <el-table-column prop="strategyNo" label="策略编号" min-width="140" />
      <el-table-column prop="source" label="策略来源" min-width="120" />
      <el-table-column prop="projectName" label="所属项目" min-width="160" />
      <el-table-column prop="strategyType" label="策略类型" min-width="100" />
      <el-table-column label="操作" width="340" fixed="right">
        <template #default="{ row }">
          <div class="table-ops">
            <el-button link type="primary" :icon="Edit" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" :icon="View" @click="openView(row)">查看</el-button>
            <el-button link type="danger" :icon="Delete" @click="onDelete(row)">删除</el-button>
            <el-button link type="primary" :icon="Operation" @click="openControl(row)">策略控制明细配置</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination-wrap">
      <el-pagination v-model:current-page="page.current" v-model:page-size="page.size"
        :total="filteredData.length" :page-sizes="[5,10,20,50]"
        layout="total, sizes, prev, pager, next, jumper" background />
    </div>

    <!-- 新增/编辑策略 弹窗 -->
    <el-dialog v-model="formVisible" :title="formMode==='view'?'查看策略':(formMode==='edit'?'编辑策略':'新增策略')" width="900px" top="5vh" :close-on-click-modal="false">
      <el-form :model="form" label-width="220px" :disabled="formMode==='view'">
        <el-row :gutter="16">
          <el-col :span="12" v-for="f in strategyFields" :key="f.prop">
            <el-form-item :label="f.label">
              <el-input v-if="f.type==='input'" v-model="form[f.prop]" placeholder="请输入" />
              <el-input-number v-else-if="f.type==='number'" v-model="form[f.prop]" :controls="false" style="width:100%" />
              <el-select v-else-if="f.type==='select'" v-model="form[f.prop]" placeholder="请选择" style="width:100%">
                <el-option v-for="o in f.options" :key="o" :label="o" :value="o" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="formVisible=false">关闭</el-button>
        <el-button v-if="formMode!=='view'" type="primary" @click="onSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 策略控制明细配置 弹窗（动态列表） -->
    <el-dialog v-model="controlVisible" title="策略控制明细配置" width="800px" top="5vh" :close-on-click-modal="false">
      <div style="margin-bottom:8px;">
        <el-button type="primary" size="small" :icon="Plus" @click="addControlRow" :disabled="controlDisabled">新增</el-button>
        <span class="form-section-tip" style="margin-left:8px;">共 {{ controlList.length }} 条</span>
      </div>
      <el-table :data="controlList" border size="small">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column label="设备编号" min-width="150">
          <template #default="{ row }">
            <el-input v-model="row.deviceNo" :disabled="controlDisabled" size="small" placeholder="设备编号" />
          </template>
        </el-table-column>
        <el-table-column label="控制类型" min-width="160">
          <template #default="{ row }">
            <el-select v-model="row.controlType" :disabled="controlDisabled" size="small" style="width:100%">
              <el-option label="启停" value="启停" />
              <el-option label="运行频率设定" value="运行频率设定" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="具体值(启动/停止/频率值)" min-width="180">
          <template #default="{ row }">
            <el-input v-model="row.value" :disabled="controlDisabled" size="small" placeholder="如：启动/停止/35Hz" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ $index }">
            <el-button v-if="!controlDisabled" link type="danger" :icon="Delete" @click="removeControlRow($index)">删除</el-button>
            <span v-else class="form-section-tip">只读</span>
          </template>
        </el-table-column>
        <template #empty><div class="device-list-empty">暂无数据，点击“新增”添加控制明细</div></template>
      </el-table>
      <template #footer>
        <el-button @click="controlVisible=false">关闭</el-button>
        <el-button v-if="!controlDisabled" type="primary" @click="onControlSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 算法生成策略 弹窗 -->
    <el-dialog v-model="algoGenVisible" title="算法生成策略" width="600px" :close-on-click-modal="false">
      <el-form :model="algoGenForm" label-width="180px">
        <el-form-item label="项目ID">
          <el-input v-model="algoGenForm.projectId" placeholder="请输入项目ID" />
        </el-form-item>
        <el-form-item label="历史数据周期">
          <el-date-picker v-model="algoGenForm.dateRange" type="datetimerange" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" style="width:100%" />
        </el-form-item>
        <el-form-item label="算法类型">
          <el-select v-model="algoGenForm.algoType" style="width:100%">
            <el-option label="优化算法" value="优化算法" />
          </el-select>
        </el-form-item>
        <el-form-item label="优化算法配置参数ID">
          <el-input v-model="algoGenForm.algoConfigId" placeholder="请输入优化算法配置参数ID" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="algoGenVisible=false">取消</el-button>
        <el-button type="primary" @click="onAlgoGenSubmit">生成</el-button>
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
    const Download = ElementPlusIconsVue.Download;
    const Upload = ElementPlusIconsVue.Upload;
    const MagicStick = ElementPlusIconsVue.MagicStick;
    const Operation = ElementPlusIconsVue.Operation;

    const sourceOpts = ['手动维护', '文件导入', '算法生成'];
    const strategyTypeOpts = ['初始', '完整'];

    const strategyFields = [
      { label: '策略编号', prop: 'strategyNo', type: 'input' },
      { label: '策略来源', prop: 'source', type: 'select', options: sourceOpts },
      { label: '所属项目', prop: 'projectName', type: 'input' },
      { label: '是否策略库', prop: 'inLibrary', type: 'select', options: ['是', '否'] },
      { label: '策略类型', prop: 'strategyType', type: 'select', options: strategyTypeOpts },
      { label: '使用优化算法参数', prop: 'algoParamRef', type: 'input' },
      { label: '用户侧冷负荷(kW)', prop: 'userCoolingLoad', type: 'number' },
      { label: '冷冻水系统供水温度(℃)', prop: 'chwSupplyTemp', type: 'number' },
      { label: '冷冻水系统总流量(m³/h)', prop: 'chwTotalFlow', type: 'number' },
      { label: '冷冻水系统管网供回水压差(kPa)', prop: 'chwDiffPressure', type: 'number' },
      { label: '室外环境干球温度(℃)', prop: 'outdoorDryBulb', type: 'number' },
      { label: '室外环境相对湿度(%)', prop: 'outdoorHumidity', type: 'number' },
      { label: '冷冻水系统回水温度(℃)', prop: 'chwReturnTemp', type: 'number' },
      { label: '冷却水系统供水温度(℃)', prop: 'cwSupplyTemp', type: 'number' },
      { label: '冷却水系统回水温度(℃)', prop: 'cwReturnTemp', type: 'number' },
      { label: '冷却水系统总流量(m³/h)', prop: 'cwTotalFlow', type: 'number' },
      { label: '冷却水系统管网供回水压差(kPa)', prop: 'cwDiffPressure', type: 'number' },
      { label: '冷源系统总电功耗(kW)', prop: 'totalPower', type: 'number' },
      { label: '冷源系统能效比EER', prop: 'eer', type: 'number' },
      { label: '冷水机组总电功率(kW)', prop: 'chillerPower', type: 'number' },
      { label: '冷冻水泵组总电功率(kW)', prop: 'chilledPumpPower', type: 'number' },
      { label: '冷却水泵组总电功率(kW)', prop: 'coolingPumpPower', type: 'number' },
      { label: '冷却塔组总电功率(kW)', prop: 'coolingTowerPower', type: 'number' }
    ];

    const makeForm = () => { const o = { id: undefined }; strategyFields.forEach(f => o[f.prop] = null); return o; };

    const filters = reactive({ source: '', strategyType: '', keyword: '' });
    const page = reactive({ current: 1, size: 10 });

    const tableData = ref([
      { id: 1, strategyNo: 'STR-001', source: '手动维护', projectName: '上海某数据中心A', strategyType: '完整' },
      { id: 2, strategyNo: 'STR-002', source: '文件导入', projectName: '苏州商业广场B', strategyType: '初始' },
      { id: 3, strategyNo: 'STR-003', source: '算法生成', projectName: '北京办公大楼C', strategyType: '完整' }
    ]);

    const filteredData = computed(() => tableData.value.filter(r => {
      if (filters.source && r.source !== filters.source) return false;
      if (filters.strategyType && r.strategyType !== filters.strategyType) return false;
      if (filters.keyword) {
        const k = filters.keyword.toLowerCase();
        if (!((r.strategyNo||'').toLowerCase().includes(k) || (r.projectName||'').toLowerCase().includes(k))) return false;
      }
      return true;
    }));
    const pagedData = computed(() => {
      const s = (page.current - 1) * page.size;
      return filteredData.value.slice(s, s + page.size);
    });

    const onSearch = () => { page.current = 1; };
    const onReset = () => { filters.source = ''; filters.strategyType = ''; filters.keyword = ''; page.current = 1; };
    const onTemplate = () => ElementPlus.ElMessage.success('模版已下载（原型模拟）');
    const onImport = () => { ElementPlus.ElMessage.success('导入成功（原型模拟）'); return false; };

    // 新增/编辑/查看
    const formVisible = ref(false);
    const formMode = ref('create');
    const form = reactive(makeForm());
    const openCreate = () => { Object.assign(form, makeForm()); formMode.value = 'create'; formVisible.value = true; };
    const openEdit = (row) => { Object.assign(form, makeForm(), row); formMode.value = 'edit'; formVisible.value = true; };
    const openView = (row) => { Object.assign(form, makeForm(), row); formMode.value = 'view'; formVisible.value = true; };
    const onSubmit = () => {
      if (formMode.value === 'create') {
        const id = Math.max(0, ...tableData.value.map(r => r.id)) + 1;
        tableData.value.push({ ...form, id });
        ElementPlus.ElMessage.success('新增成功');
      } else {
        const idx = tableData.value.findIndex(r => r.id === form.id);
        if (idx > -1) tableData.value[idx] = { ...form };
        ElementPlus.ElMessage.success('保存成功');
      }
      formVisible.value = false;
    };
    const onDelete = (row) => {
      ElementPlus.ElMessageBox.confirm('确认删除该策略？', '提示', { type: 'warning' })
        .then(() => {
          const idx = tableData.value.findIndex(r => r.id === row.id);
          if (idx > -1) tableData.value.splice(idx, 1);
          ElementPlus.ElMessage.success('删除成功');
        }).catch(() => {});
    };

    // 策略控制明细配置
    const controlVisible = ref(false);
    const controlDisabled = ref(false);
    const controlList = ref([]);
    const addControlRow = () => { controlList.value.push({ deviceNo: '', controlType: '启停', value: '' }); };
    const removeControlRow = (idx) => { controlList.value.splice(idx, 1); };
    const openControl = (row) => {
      controlDisabled.value = false;
      controlList.value = [
        { deviceNo: 'CH-01', controlType: '运行频率设定', value: '45Hz' },
        { deviceNo: 'CP-01', controlType: '启停', value: '启动' }
      ];
      controlVisible.value = true;
    };
    const onControlSubmit = () => { ElementPlus.ElMessage.success('控制明细已保存'); controlVisible.value = false; };

    // 算法生成策略
    const algoGenVisible = ref(false);
    const algoGenForm = reactive({ projectId: '', dateRange: [], algoType: '优化算法', algoConfigId: '' });
    const openAlgoGen = () => {
      algoGenForm.projectId = ''; algoGenForm.dateRange = []; algoGenForm.algoType = '优化算法'; algoGenForm.algoConfigId = '';
      algoGenVisible.value = true;
    };
    const onAlgoGenSubmit = () => {
      const id = Math.max(0, ...tableData.value.map(r => r.id)) + 1;
      tableData.value.push({ id, strategyNo: 'STR-ALGO-' + (1000 + id), source: '算法生成', projectName: '算法生成策略', strategyType: '完整' });
      ElementPlus.ElMessage.success('算法生成策略成功');
      algoGenVisible.value = false;
    };

    return {
      Search, RefreshLeft, Plus, Edit, View, Delete, Download, Upload, MagicStick, Operation,
      sourceOpts, strategyTypeOpts, strategyFields, filters, page, tableData, filteredData, pagedData,
      onSearch, onReset, onTemplate, onImport,
      formVisible, formMode, form, openCreate, openEdit, openView, onSubmit, onDelete,
      controlVisible, controlDisabled, controlList, addControlRow, removeControlRow, openControl, onControlSubmit,
      algoGenVisible, algoGenForm, openAlgoGen, onAlgoGenSubmit
    };
  }
};
