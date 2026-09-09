// 最优策略页面
window.PageComponents = window.PageComponents || {};

window.PageComponents['optimal-strategy-page'] = {
  template: `
  <div class="page-card">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-input v-model="filters.keyword" placeholder="策略编号/所属项目" clearable @keyup.enter="onSearch" />
      <el-button type="primary" :icon="Search" @click="onSearch">搜索</el-button>
      <el-button :icon="RefreshLeft" @click="onReset">重置</el-button>
      <div class="spacer"></div>
      <el-button type="primary" :icon="Aim" @click="openFetch">获取最优策略</el-button>
    </div>

    <!-- 列表 -->
    <el-table :data="pagedData" border stripe>
      <el-table-column type="index" label="#" width="50" />
      <el-table-column prop="strategyNo" label="策略编号" min-width="140" />
      <el-table-column prop="projectName" label="所属项目" min-width="160" />
      <el-table-column label="获取策略请求信息" min-width="180">
        <template #default="{ row }">
          <el-button link type="primary" :icon="View" @click="openRequestInfo(row)">查看</el-button>
        </template>
      </el-table-column>
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

    <!-- 获取策略请求信息 弹窗（同时用于获取新策略与查看请求信息） -->
    <el-dialog v-model="requestVisible" :title="requestMode==='view'?'获取策略请求信息':'获取最优策略'" width="900px" top="5vh" :close-on-click-modal="false">
      <el-form :model="requestForm" label-width="240px" :disabled="requestMode==='view'">
        <el-row :gutter="16">
          <el-col :span="12" v-for="f in requestFields" :key="f.prop">
            <el-form-item :label="f.label">
              <el-input-number v-if="f.type==='number'" v-model="requestForm[f.prop]" :controls="false" style="width:100%" />
              <el-select v-else-if="f.type==='select'" v-model="requestForm[f.prop]" style="width:100%">
                <el-option v-for="o in f.options" :key="o" :label="o" :value="o" />
              </el-select>
              <el-input v-else v-model="requestForm[f.prop]" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="requestVisible=false">关闭</el-button>
        <el-button v-if="requestMode!=='view'" type="primary" @click="onFetchSubmit">获取</el-button>
      </template>
    </el-dialog>

    <!-- 编辑/查看 弹窗 -->
    <el-dialog v-model="editVisible" :title="editMode==='view'?'查看最优策略':'编辑最优策略'" width="700px" :close-on-click-modal="false">
      <el-form :model="editForm" label-width="160px" :disabled="editMode==='view'">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="策略编号"><el-input v-model="editForm.strategyNo" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属项目"><el-input v-model="editForm.projectName" /></el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="editVisible=false">关闭</el-button>
        <el-button v-if="editMode!=='view'" type="primary" @click="onEditSubmit">保存</el-button>
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
    const Operation = ElementPlusIconsVue.Operation;
    const Aim = ElementPlusIconsVue.Aim;

    const requestFields = [
      { label: '系统冷负荷(kW)', prop: 'systemCoolingLoad', type: 'number' },
      { label: '室外环境干球温度(℃)', prop: 'outdoorDryBulb', type: 'number' },
      { label: '室外环境相对湿度(%)', prop: 'outdoorHumidity', type: 'number' },
      { label: '冷冻水系统最小流量(m³/h)', prop: 'chwMinFlow', type: 'number' },
      { label: '实际冷冻水总管供水温度(℃)', prop: 'actualChwSupplyTemp', type: 'number' },
      { label: '冷冻水系统总流量(m³/h)', prop: 'chwTotalFlow', type: 'number' },
      { label: '实际冷冻水供回水压差(kPa)', prop: 'actualChwDiffPressure', type: 'number' },
      { label: '冷源系统实际总电功率(kW)', prop: 'actualTotalPower', type: 'number' },
      { label: '实际冷冻水总管回水温度(℃)', prop: 'actualChwReturnTemp', type: 'number' },
      { label: '策略执行标记', prop: 'executeFlag', type: 'select', options: ['待执行', '已执行', '已跳过'] },
      { label: '冷却水系统总流量(m³/h)', prop: 'cwTotalFlow', type: 'number' },
      { label: '实际冷却水供回水压差(kPa)', prop: 'actualCwDiffPressure', type: 'number' },
      { label: '实际冷却水总管进水温度(℃)', prop: 'actualCwInletTemp', type: 'number' },
      { label: '实际冷却水总管回水温度(℃)', prop: 'actualCwReturnTemp', type: 'number' },
      { label: '最不利末端供回水压差(kPa)', prop: 'worstDiffPressure', type: 'number' },
      { label: '最不利末端室内干球温度(℃)', prop: 'worstIndoorDryBulb', type: 'number' },
      { label: '最不利末端室内相对湿度(%)', prop: 'worstIndoorHumidity', type: 'number' }
    ];

    const makeRequestForm = () => { const o = {}; requestFields.forEach(f => o[f.prop] = null); return o; };

    const filters = reactive({ keyword: '' });
    const page = reactive({ current: 1, size: 10 });

    const tableData = ref([
      { id: 1, strategyNo: 'OPT-001', projectName: '上海某数据中心A', requestInfo: { ...makeRequestForm(), systemCoolingLoad: 3200, outdoorDryBulb: 32 } },
      { id: 2, strategyNo: 'OPT-002', projectName: '苏州商业广场B', requestInfo: { ...makeRequestForm(), systemCoolingLoad: 5400, outdoorDryBulb: 34 } }
    ]);

    const filteredData = computed(() => {
      if (!filters.keyword) return tableData.value;
      const k = filters.keyword.toLowerCase();
      return tableData.value.filter(r => (r.strategyNo||'').toLowerCase().includes(k) || (r.projectName||'').toLowerCase().includes(k));
    });
    const pagedData = computed(() => {
      const s = (page.current - 1) * page.size;
      return filteredData.value.slice(s, s + page.size);
    });

    const onSearch = () => { page.current = 1; };
    const onReset = () => { filters.keyword = ''; page.current = 1; };

    // 获取策略请求信息弹窗（获取新策略 / 查看请求信息）
    const requestVisible = ref(false);
    const requestMode = ref('fetch'); // fetch / view
    const requestForm = reactive(makeRequestForm());
    let currentEditRow = null;
    const openFetch = () => {
      Object.assign(requestForm, makeRequestForm());
      requestMode.value = 'fetch';
      currentEditRow = null;
      requestVisible.value = true;
    };
    const openRequestInfo = (row) => {
      Object.assign(requestForm, makeRequestForm(), row.requestInfo || {});
      requestMode.value = 'view';
      currentEditRow = row;
      requestVisible.value = true;
    };
    const onFetchSubmit = () => {
      const id = Math.max(0, ...tableData.value.map(r => r.id)) + 1;
      tableData.value.push({
        id,
        strategyNo: 'OPT-' + String(id).padStart(3, '0'),
        projectName: '通过获取最优策略生成',
        requestInfo: { ...requestForm }
      });
      ElementPlus.ElMessage.success('已获取最优策略');
      requestVisible.value = false;
    };

    // 编辑/查看
    const editVisible = ref(false);
    const editMode = ref('edit');
    const editForm = reactive({ id: undefined, strategyNo: '', projectName: '' });
    const openEdit = (row) => { Object.assign(editForm, { id: row.id, strategyNo: row.strategyNo, projectName: row.projectName }); editMode.value = 'edit'; editVisible.value = true; };
    const openView = (row) => { Object.assign(editForm, { id: row.id, strategyNo: row.strategyNo, projectName: row.projectName }); editMode.value = 'view'; editVisible.value = true; };
    const onEditSubmit = () => {
      const idx = tableData.value.findIndex(r => r.id === editForm.id);
      if (idx > -1) { tableData.value[idx].strategyNo = editForm.strategyNo; tableData.value[idx].projectName = editForm.projectName; }
      ElementPlus.ElMessage.success('保存成功');
      editVisible.value = false;
    };
    const onDelete = (row) => {
      ElementPlus.ElMessageBox.confirm('确认删除该最优策略？', '提示', { type: 'warning' })
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
        { deviceNo: 'CH-01', controlType: '运行频率设定', value: '42Hz' },
        { deviceNo: 'CP-01', controlType: '启停', value: '启动' }
      ];
      controlVisible.value = true;
    };
    const onControlSubmit = () => { ElementPlus.ElMessage.success('控制明细已保存'); controlVisible.value = false; };

    return {
      Search, RefreshLeft, Plus, Edit, View, Delete, Operation, Aim,
      requestFields, filters, page, tableData, filteredData, pagedData,
      onSearch, onReset,
      requestVisible, requestMode, requestForm, openFetch, openRequestInfo, onFetchSubmit,
      editVisible, editMode, editForm, openEdit, openView, onEditSubmit, onDelete,
      controlVisible, controlDisabled, controlList, addControlRow, removeControlRow, openControl, onControlSubmit
    };
  }
};
