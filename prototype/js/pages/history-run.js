// 历史运行页面 - 主子列表 + 动态表头
window.PageComponents = window.PageComponents || {};

window.PageComponents['history-run-page'] = {
  template: `
  <div class="page-card">
    <h3 style="margin:0 0 12px;color:#1f2d3d;">主表 - 整体运行数据</h3>
    <!-- 主表工具栏 -->
    <div class="toolbar">
      <el-input v-model="masterFilters.keyword" placeholder="运行ID/所属项目" clearable @keyup.enter="onMasterSearch" />
      <el-button type="primary" :icon="Search" @click="onMasterSearch">搜索</el-button>
      <el-button :icon="RefreshLeft" @click="onMasterReset">重置</el-button>
      <div class="spacer"></div>
      <el-button type="primary" :icon="Plus" @click="openMasterCreate">新增整体运行数据</el-button>
      <el-button :icon="Download" @click="onMasterTemplate">整体运行模版下载</el-button>
      <el-upload :show-file-list="false" :before-upload="onMasterImport" accept=".xlsx,.xls,.csv">
        <el-button :icon="Upload">数据导入</el-button>
      </el-upload>
    </div>

    <!-- 主表 -->
    <el-table :data="pagedMaster" border stripe highlight-current-row @current-change="onMasterSelect">
      <el-table-column type="index" label="#" width="50" />
      <el-table-column prop="systemCoolingLoad" label="系统冷负荷(kW)" min-width="140" />
      <el-table-column prop="systemTotalPower" label="系统总功率(kW)" min-width="140" />
      <el-table-column prop="systemEER" label="系统能效比" min-width="120" />
      <el-table-column prop="outdoorTemp" label="室外环境温度(℃)" min-width="150" />
      <el-table-column prop="outdoorHumidity" label="室外环境相对湿度(%)" min-width="170" />
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <div class="table-ops">
            <el-button link type="primary" :icon="Edit" @click="openMasterEdit(row)">编辑</el-button>
            <el-button link type="primary" :icon="View" @click="openMasterView(row)">查看</el-button>
            <el-button link type="danger" :icon="Delete" @click="onMasterDelete(row)">删除</el-button>
          </div>
        </template>
      </el-table-column>
      <template #empty><div class="device-list-empty">点击表格行可联动下方明细</div></template>
    </el-table>
    <div class="pagination-wrap">
      <el-pagination v-model:current-page="masterPage.current" v-model:page-size="masterPage.size"
        :total="filteredMaster.length" :page-sizes="[5,10,20,50]"
        layout="total, sizes, prev, pager, next, jumper" background />
    </div>

    <!-- 子表 -->
    <el-divider content-position="left">子表 - 运行明细数据 <span v-if="selectedMaster" style="color:#409eff;font-weight:normal;">（当前主记录：运行ID {{ selectedMaster.runId }}）</span></el-divider>
    <div class="toolbar">
      <el-select v-model="detailFilters.deviceType" placeholder="设备类型" clearable @change="onDeviceTypeChange">
        <el-option v-for="o in deviceTypeOpts" :key="o" :label="o" :value="o" />
      </el-select>
      <el-input v-model="detailFilters.keyword" placeholder="设备编号" clearable @keyup.enter="onDetailSearch" />
      <el-button type="primary" :icon="Search" @click="onDetailSearch">搜索</el-button>
      <el-button :icon="RefreshLeft" @click="onDetailReset">重置</el-button>
      <div class="spacer"></div>
      <el-button type="primary" :icon="Plus" @click="openDetailCreate" :disabled="!selectedMaster || !detailFilters.deviceType">新增运行明细数据</el-button>
      <el-button :icon="Download" @click="onDetailTemplate">运行明细模版下载</el-button>
      <el-upload :show-file-list="false" :before-upload="onDetailImport" accept=".xlsx,.xls,.csv">
        <el-button :icon="Upload">数据导入</el-button>
      </el-upload>
    </div>
    <el-alert v-if="!detailFilters.deviceType" title="请先选择设备类型以加载动态表头" type="info" :closable="false" show-icon />
    <el-alert v-else-if="!selectedMaster" title="请先在主表选择一条记录" type="info" :closable="false" show-icon />
    <template v-else>
      <el-table :data="pagedDetail" border stripe size="small">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="deviceNo" label="设备编号" min-width="120" />
        <el-table-column v-for="f in currentDetailColumns" :key="f.prop" :prop="f.prop" :label="f.label" :min-width="f.minWidth||130" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="table-ops">
              <el-button link type="primary" :icon="Edit" @click="openDetailEdit(row)">编辑</el-button>
              <el-button link type="primary" :icon="View" @click="openDetailView(row)">查看</el-button>
              <el-button link type="danger" :icon="Delete" @click="onDetailDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty><div class="device-list-empty">暂无明细数据</div></template>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination v-model:current-page="detailPage.current" v-model:page-size="detailPage.size"
          :total="filteredDetail.length" :page-sizes="[5,10,20,50]"
          layout="total, sizes, prev, pager, next, jumper" background />
      </div>
    </template>

    <!-- 新增整体运行数据 弹窗 -->
    <el-dialog v-model="masterFormVisible" :title="masterFormMode==='view'?'查看整体运行数据':(masterFormMode==='edit'?'编辑整体运行数据':'新增整体运行数据')" width="900px" top="5vh" :close-on-click-modal="false">
      <el-form :model="masterForm" label-width="200px" :disabled="masterFormMode==='view'">
        <el-row :gutter="16">
          <el-col :span="12" v-for="f in masterFields" :key="f.prop">
            <el-form-item :label="f.label">
              <el-input-number v-if="f.type==='number'" v-model="masterForm[f.prop]" :controls="false" style="width:100%" />
              <el-input v-else v-model="masterForm[f.prop]" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="masterFormVisible=false">关闭</el-button>
        <el-button v-if="masterFormMode!=='view'" type="primary" @click="onMasterSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 新增运行明细 弹窗（按设备类型动态字段） -->
    <el-dialog v-model="detailFormVisible" :title="detailFormMode==='view'?'查看运行明细':(detailFormMode==='edit'?'编辑运行明细':'新增运行明细')" width="900px" top="5vh" :close-on-click-modal="false">
      <el-alert :title="'当前设备类型：' + detailFilters.deviceType" type="info" :closable="false" show-icon style="margin-bottom:12px;" />
      <el-form :model="detailForm" label-width="200px" :disabled="detailFormMode==='view'">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="设备编号">
              <el-input v-model="detailForm.deviceNo" placeholder="请输入设备编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-for="f in currentDetailFields" :key="f.prop">
            <el-form-item :label="f.label">
              <el-input-number v-if="f.type==='number'" v-model="detailForm[f.prop]" :controls="false" style="width:100%" />
              <el-select v-else-if="f.type==='select'" v-model="detailForm[f.prop]" style="width:100%">
                <el-option v-for="o in f.options" :key="o" :label="o" :value="o" />
              </el-select>
              <el-input v-else v-model="detailForm[f.prop]" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="detailFormVisible=false">关闭</el-button>
        <el-button v-if="detailFormMode!=='view'" type="primary" @click="onDetailSubmit">保存</el-button>
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

    const deviceTypeOpts = ['冷水机组', '冷冻泵', '冷却泵', '冷却塔'];

    // 主表字段
    const masterFields = [
      { label: '总干管供水温度(℃)', prop: 'mainSupplyTemp', type: 'number' },
      { label: '总干管回水温度(旁通前)(℃)', prop: 'mainReturnTempBefore', type: 'number' },
      { label: '总干管回水温度(旁通后)(℃)', prop: 'mainReturnTempAfter', type: 'number' },
      { label: '冷冻水管网供回水压差(kPa)', prop: 'chwPipeDiffPressure', type: 'number' },
      { label: '冷冻水系统总流量(m³/h)', prop: 'chwTotalFlow', type: 'number' },
      { label: '旁通阀开度(%)', prop: 'bypassValveOpening', type: 'number' },
      { label: '总干管出水温度(℃)', prop: 'mainOutletTemp', type: 'number' },
      { label: '总干管回水温度(℃)', prop: 'mainReturnTemp', type: 'number' },
      { label: '冷却水系统供回水压差(kPa)', prop: 'cwDiffPressure', type: 'number' },
      { label: '冷却水系统总流量(m³/h)', prop: 'cwTotalFlow', type: 'number' },
      { label: '冷却水补水流量(m³/h)', prop: 'cwMakeupFlow', type: 'number' },
      { label: '室外环境温度(℃)', prop: 'outdoorTemp', type: 'number' },
      { label: '室外环境相对湿度(%)', prop: 'outdoorHumidity', type: 'number' },
      { label: '系统冷负荷(kW)', prop: 'systemCoolingLoad', type: 'number' },
      { label: '系统总功率(kW)', prop: 'systemTotalPower', type: 'number' },
      { label: '系统能效比', prop: 'systemEER', type: 'number' },
      { label: '所属项目', prop: 'projectName', type: 'input' },
      { label: '运行ID', prop: 'runId', type: 'input' }
    ];

    // 各设备类型：动态表头列 + 表单字段
    const deviceFieldMap = {
      '冷水机组': {
        columns: [
          { label: '蒸发温度(℃)', prop: 'evapTemp' },
          { label: '冷凝温度(℃)', prop: 'condTemp' },
          { label: '蒸发压力(MPa)', prop: 'evapPressure' },
          { label: '冷凝压力(MPa)', prop: 'condPressure' },
          { label: '压缩机排气温度(℃)', prop: 'exhaustTemp' },
          { label: '压缩机功率(kW)', prop: 'compressorPower' },
          { label: '负载率', prop: 'loadRate' }
        ],
        formFields: [
          { label: '蒸发温度(℃)', prop: 'evapTemp', type: 'number' },
          { label: '冷凝温度(℃)', prop: 'condTemp', type: 'number' },
          { label: '蒸发压力(MPa)', prop: 'evapPressure', type: 'number' },
          { label: '冷凝压力(MPa)', prop: 'condPressure', type: 'number' },
          { label: '压缩机排气温度(℃)', prop: 'exhaustTemp', type: 'number' },
          { label: '压缩机功率(kW)', prop: 'compressorPower', type: 'number' },
          { label: '负载率', prop: 'loadRate', type: 'number' },
          { label: '冷冻水出水温度(℃)', prop: 'chwOutletTemp', type: 'number' },
          { label: '冷冻水进水温度(℃)', prop: 'chwInletTemp', type: 'number' },
          { label: '冷却水进水温度(℃)', prop: 'cwInletTemp', type: 'number' },
          { label: '冷却水出水温度(℃)', prop: 'cwOutletTemp', type: 'number' },
          { label: '冷冻水流量(m³/h)', prop: 'chwFlow', type: 'number' },
          { label: '冷却水流量(m³/h)', prop: 'cwFlow', type: 'number' },
          { label: '蒸发器进出水压差(kPa)', prop: 'evapDiffPressure', type: 'number' },
          { label: '冷凝器进出水压差(kPa)', prop: 'condDiffPressure', type: 'number' },
          { label: '冷水机组总功率(kW)', prop: 'chillerTotalPower', type: 'number' },
          { label: '冷水机组实际COP', prop: 'chillerActualCop', type: 'number' },
          { label: '机组开机状态', prop: 'chillerOnStatus', type: 'select', options: ['运行', '停机'] }
        ]
      },
      '冷冻泵': {
        columns: [
          { label: '冷冻水泵功率(kW)', prop: 'pumpPower' },
          { label: '冷冻水泵运行频率(Hz)', prop: 'pumpFreq' },
          { label: '冷冻水泵进出口压差(kPa)', prop: 'pumpDiffPressure' },
          { label: '冷冻水泵流量(m³/h)', prop: 'pumpFlow' }
        ],
        formFields: [
          { label: '冷冻水泵功率(kW)', prop: 'pumpPower', type: 'number' },
          { label: '冷冻水泵运行频率(Hz)', prop: 'pumpFreq', type: 'number' },
          { label: '冷冻水泵进出口压差(kPa)', prop: 'pumpDiffPressure', type: 'number' },
          { label: '冷冻水泵流量(m³/h)', prop: 'pumpFlow', type: 'number' },
          { label: '冷冻水泵运行状态', prop: 'pumpRunStatus', type: 'select', options: ['运行', '停机'] }
        ]
      },
      '冷却泵': {
        columns: [
          { label: '冷却水泵功率(kW)', prop: 'pumpPower' },
          { label: '冷却水泵运行频率(Hz)', prop: 'pumpFreq' },
          { label: '冷却水泵进出口压差(kPa)', prop: 'pumpDiffPressure' },
          { label: '冷却水泵流量(m³/h)', prop: 'pumpFlow' }
        ],
        formFields: [
          { label: '冷却水泵功率(kW)', prop: 'pumpPower', type: 'number' },
          { label: '冷却水泵运行频率(Hz)', prop: 'pumpFreq', type: 'number' },
          { label: '冷却水泵进出口压差(kPa)', prop: 'pumpDiffPressure', type: 'number' },
          { label: '冷却水泵流量(m³/h)', prop: 'pumpFlow', type: 'number' },
          { label: '冷却水泵运行状态', prop: 'pumpRunStatus', type: 'select', options: ['运行', '停机'] }
        ]
      },
      '冷却塔': {
        columns: [
          { label: '冷却塔风机功率(kW)', prop: 'fanPower' },
          { label: '冷却塔风机运行频率(Hz)', prop: 'fanFreq' },
          { label: '冷却塔风量(m³/h)', prop: 'airFlow' }
        ],
        formFields: [
          { label: '冷却塔风机功率(kW)', prop: 'fanPower', type: 'number' },
          { label: '冷却塔风机运行频率(Hz)', prop: 'fanFreq', type: 'number' },
          { label: '冷却塔风量(m³/h)', prop: 'airFlow', type: 'number' },
          { label: '冷却水进出塔压差(kPa)', prop: 'towerDiffPressure', type: 'number' },
          { label: '冷却塔冷却水流量(m³/h)', prop: 'towerWaterFlow', type: 'number' },
          { label: '冷却水进塔温度(℃)', prop: 'cwInletTowerTemp', type: 'number' },
          { label: '冷却水出塔温度(℃)', prop: 'cwOutletTowerTemp', type: 'number' },
          { label: '冷却塔补水流量(m³/h)', prop: 'towerMakeupFlow', type: 'number' },
          { label: '冷却塔排污流量(m³/h)', prop: 'towerBlowdownFlow', type: 'number' },
          { label: '进风干球温度(℃)', prop: 'inletDryBulbTemp', type: 'number' },
          { label: '进风相对湿度(%)', prop: 'inletHumidity', type: 'number' },
          { label: '出风干球温度(℃)', prop: 'outletDryBulbTemp', type: 'number' },
          { label: '出风相对湿度(%)', prop: 'outletHumidity', type: 'number' },
          { label: '冷却塔开机状态', prop: 'towerOnStatus', type: 'select', options: ['运行', '停机'] }
        ]
      }
    };

    // 主表数据
    const masterData = ref([
      { id: 1, runId: 'RUN20240901-001', projectName: '上海某数据中心A', systemCoolingLoad: 3200, systemTotalPower: 620, systemEER: 5.16, outdoorTemp: 32, outdoorHumidity: 65 },
      { id: 2, runId: 'RUN20240901-002', projectName: '苏州商业广场B', systemCoolingLoad: 5400, systemTotalPower: 1100, systemEER: 4.91, outdoorTemp: 34, outdoorHumidity: 70 },
      { id: 3, runId: 'RUN20240901-003', projectName: '北京办公大楼C', systemCoolingLoad: 2100, systemTotalPower: 430, systemEER: 4.88, outdoorTemp: 30, outdoorHumidity: 55 }
    ]);
    const masterFilters = reactive({ keyword: '' });
    const masterPage = reactive({ current: 1, size: 10 });
    const filteredMaster = computed(() => {
      if (!masterFilters.keyword) return masterData.value;
      const k = masterFilters.keyword.toLowerCase();
      return masterData.value.filter(r => (r.runId||'').toLowerCase().includes(k) || (r.projectName||'').toLowerCase().includes(k));
    });
    const pagedMaster = computed(() => {
      const s = (masterPage.current - 1) * masterPage.size;
      return filteredMaster.value.slice(s, s + masterPage.size);
    });
    const onMasterSearch = () => { masterPage.current = 1; };
    const onMasterReset = () => { masterFilters.keyword = ''; masterPage.current = 1; };

    const selectedMaster = ref(null);
    const onMasterSelect = (row) => {
      if (row) selectedMaster.value = row;
    };

    // 主表弹窗
    const masterFormVisible = ref(false);
    const masterFormMode = ref('create');
    const makeMasterForm = () => { const o = { id: undefined }; masterFields.forEach(f => o[f.prop] = null); return o; };
    const masterForm = reactive(makeMasterForm());
    const openMasterCreate = () => { Object.assign(masterForm, makeMasterForm()); masterFormMode.value = 'create'; masterFormVisible.value = true; };
    const openMasterEdit = (row) => { Object.assign(masterForm, makeMasterForm(), row); masterFormMode.value = 'edit'; masterFormVisible.value = true; };
    const openMasterView = (row) => { Object.assign(masterForm, makeMasterForm(), row); masterFormMode.value = 'view'; masterFormVisible.value = true; };
    const onMasterSubmit = () => {
      if (masterFormMode.value === 'create') {
        const id = Math.max(0, ...masterData.value.map(r => r.id)) + 1;
        masterData.value.push({ ...masterForm, id });
        ElementPlus.ElMessage.success('新增成功');
      } else {
        const idx = masterData.value.findIndex(r => r.id === masterForm.id);
        if (idx > -1) masterData.value[idx] = { ...masterForm };
        ElementPlus.ElMessage.success('保存成功');
      }
      masterFormVisible.value = false;
    };
    const onMasterDelete = (row) => {
      ElementPlus.ElMessageBox.confirm('确认删除该整体运行数据？', '提示', { type: 'warning' })
        .then(() => {
          const idx = masterData.value.findIndex(r => r.id === row.id);
          if (idx > -1) masterData.value.splice(idx, 1);
          if (selectedMaster.value && selectedMaster.value.id === row.id) selectedMaster.value = null;
          ElementPlus.ElMessage.success('删除成功');
        }).catch(() => {});
    };
    const onMasterTemplate = () => ElementPlus.ElMessage.success('整体运行模版已下载（原型模拟）');
    const onMasterImport = () => { ElementPlus.ElMessage.success('数据导入成功（原型模拟）'); return false; };

    // 子表
    const detailFilters = reactive({ deviceType: '', keyword: '' });
    const detailPage = reactive({ current: 1, size: 10 });
    // 模拟明细数据，按设备类型分组
    const detailDataStore = reactive({
      '冷水机组': [
        { id: 1, masterId: 1, deviceNo: 'CH-01', evapTemp: 4.5, condTemp: 38, evapPressure: 0.35, condPressure: 1.6, exhaustTemp: 75, compressorPower: 210, loadRate: 0.75 },
        { id: 2, masterId: 1, deviceNo: 'CH-02', evapTemp: 4.8, condTemp: 39, evapPressure: 0.36, condPressure: 1.62, exhaustTemp: 77, compressorPower: 215, loadRate: 0.72 }
      ],
      '冷冻泵': [
        { id: 11, masterId: 1, deviceNo: 'CP-01', pumpPower: 28, pumpFreq: 42, pumpDiffPressure: 180, pumpFlow: 190 }
      ],
      '冷却泵': [
        { id: 21, masterId: 1, deviceNo: 'CWP-01', pumpPower: 35, pumpFreq: 45, pumpDiffPressure: 150, pumpFlow: 240 }
      ],
      '冷却塔': [
        { id: 31, masterId: 1, deviceNo: 'CT-01', fanPower: 14, fanFreq: 38, airFlow: 78000 }
      ]
    });

    const currentDetailColumns = computed(() => {
      const cfg = deviceFieldMap[detailFilters.deviceType];
      return cfg ? cfg.columns : [];
    });
    const currentDetailFields = computed(() => {
      const cfg = deviceFieldMap[detailFilters.deviceType];
      return cfg ? cfg.formFields : [];
    });

    const detailList = computed(() => {
      const list = detailDataStore[detailFilters.deviceType] || [];
      let arr = list.filter(r => r.masterId === (selectedMaster.value ? selectedMaster.value.id : -1));
      if (detailFilters.keyword) {
        const k = detailFilters.keyword.toLowerCase();
        arr = arr.filter(r => (r.deviceNo||'').toLowerCase().includes(k));
      }
      return arr;
    });
    const filteredDetail = computed(() => detailList.value);
    const pagedDetail = computed(() => {
      const s = (detailPage.current - 1) * detailPage.size;
      return filteredDetail.value.slice(s, s + detailPage.size);
    });

    const onDeviceTypeChange = () => { detailPage.current = 1; };
    const onDetailSearch = () => { detailPage.current = 1; };
    const onDetailReset = () => { detailFilters.keyword = ''; detailPage.current = 1; };
    const onDetailTemplate = () => ElementPlus.ElMessage.success('运行明细模版已下载（原型模拟）');
    const onDetailImport = () => { ElementPlus.ElMessage.success('数据导入成功（原型模拟）'); return false; };

    // 明细弹窗
    const detailFormVisible = ref(false);
    const detailFormMode = ref('create');
    const makeDetailForm = () => { const o = { id: undefined, masterId: undefined, deviceNo: '' }; currentDetailFields.value.forEach(f => o[f.prop] = null); return o; };
    const detailForm = reactive({});
    const openDetailCreate = () => {
      Object.assign(detailForm, makeDetailForm());
      detailForm.masterId = selectedMaster.value.id;
      detailFormMode.value = 'create';
      detailFormVisible.value = true;
    };
    const openDetailEdit = (row) => { Object.assign(detailForm, makeDetailForm(), row); detailFormMode.value = 'edit'; detailFormVisible.value = true; };
    const openDetailView = (row) => { Object.assign(detailForm, makeDetailForm(), row); detailFormMode.value = 'view'; detailFormVisible.value = true; };
    const onDetailSubmit = () => {
      const arr = detailDataStore[detailFilters.deviceType] || (detailDataStore[detailFilters.deviceType] = []);
      if (detailFormMode.value === 'create') {
        const id = Math.max(0, ...arr.map(r => r.id || 0)) + 1;
        arr.push({ ...detailForm, id, masterId: selectedMaster.value.id });
        ElementPlus.ElMessage.success('新增成功');
      } else {
        const idx = arr.findIndex(r => r.id === detailForm.id);
        if (idx > -1) arr[idx] = { ...detailForm };
        ElementPlus.ElMessage.success('保存成功');
      }
      detailFormVisible.value = false;
    };
    const onDetailDelete = (row) => {
      ElementPlus.ElMessageBox.confirm('确认删除该运行明细？', '提示', { type: 'warning' })
        .then(() => {
          const arr = detailDataStore[detailFilters.deviceType] || [];
          const idx = arr.findIndex(r => r.id === row.id);
          if (idx > -1) arr.splice(idx, 1);
          ElementPlus.ElMessage.success('删除成功');
        }).catch(() => {});
    };

    return {
      Search, RefreshLeft, Plus, Edit, View, Delete, Download, Upload,
      deviceTypeOpts, masterFields,
      masterFilters, masterPage, filteredMaster, pagedMaster, onMasterSearch, onMasterReset,
      selectedMaster, onMasterSelect,
      masterFormVisible, masterFormMode, masterForm, openMasterCreate, openMasterEdit, openMasterView, onMasterSubmit, onMasterDelete, onMasterTemplate, onMasterImport,
      detailFilters, detailPage, filteredDetail, pagedDetail,
      currentDetailColumns, currentDetailFields,
      onDeviceTypeChange, onDetailSearch, onDetailReset, onDetailTemplate, onDetailImport,
      detailFormVisible, detailFormMode, detailForm, openDetailCreate, openDetailEdit, openDetailView, onDetailSubmit, onDetailDelete
    };
  }
};
