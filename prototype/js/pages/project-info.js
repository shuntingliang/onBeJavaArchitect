// 项目信息页面
window.PageComponents = window.PageComponents || {};

window.PageComponents['project-info-page'] = {
  template: `
  <div class="page-card">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-select v-model="filters.projectType" placeholder="项目类型" clearable>
        <el-option v-for="o in opts.projectType" :key="o" :label="o" :value="o" />
      </el-select>
      <el-select v-model="filters.buildingUse" placeholder="建筑用途" clearable>
        <el-option v-for="o in opts.buildingUse" :key="o" :label="o" :value="o" />
      </el-select>
      <el-input v-model="filters.keyword" placeholder="项目编号/名称" clearable @keyup.enter="onSearch" />
      <el-button type="primary" :icon="Search" @click="onSearch">搜索</el-button>
      <el-button :icon="RefreshLeft" @click="onReset">重置</el-button>
      <div class="spacer"></div>
      <el-button type="primary" :icon="Plus" @click="openCreate">创建项目信息</el-button>
    </div>

    <!-- 列表 -->
    <el-table :data="pagedData" border stripe>
      <el-table-column type="index" label="#" width="50" />
      <el-table-column prop="projectNo" label="项目编号" min-width="120" />
      <el-table-column prop="projectName" label="项目名称" min-width="160" />
      <el-table-column prop="projectType" label="项目类型" min-width="120" />
      <el-table-column prop="buildingArea" label="建筑面积(㎡)" min-width="120" />
      <el-table-column prop="buildingUse" label="建筑用途" min-width="120" />
      <el-table-column label="操作" width="340" fixed="right">
        <template #default="{ row }">
          <div class="table-ops">
            <el-button link type="primary" :icon="Edit" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" :icon="View" @click="openView(row)">查看</el-button>
            <el-button link type="danger" :icon="Delete" @click="onDelete(row)">删除</el-button>
            <el-button link type="primary" :icon="SetUp" @click="openDevice(row)">设备概况配置</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="page.current"
        v-model:page-size="page.size"
        :total="filteredData.length"
        :page-sizes="[5,10,20,50]"
        layout="total, sizes, prev, pager, next, jumper"
        background
      />
    </div>

    <!-- 创建/编辑 弹窗（手风琴） -->
    <el-dialog
      v-model="formVisible"
      :title="formMode === 'view' ? '查看项目信息' : (formMode === 'edit' ? '编辑项目信息' : '创建项目信息')"
      width="900px"
      top="5vh"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="180px" :disabled="formMode === 'view'">
        <el-collapse v-model="activeNames">
          <el-collapse-item title="基本信息" name="basic">
            <el-row :gutter="16">
              <el-col :span="12" v-for="f in fields.basic" :key="f.prop">
                <el-form-item :label="f.label">
                  <el-input v-if="f.type==='input'" v-model="form[f.prop]" :placeholder="'请输入'+f.label" />
                  <el-input-number v-else-if="f.type==='number'" v-model="form[f.prop]" :controls="false" style="width:100%" />
                  <el-select v-else-if="f.type==='select'" v-model="form[f.prop]" placeholder="请选择" style="width:100%">
                    <el-option v-for="o in f.options" :key="o" :label="o" :value="o" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-collapse-item>

          <el-collapse-item title="电价信息" name="electricity">
            <el-row :gutter="16">
              <el-col :span="12" v-for="f in fields.electricity" :key="f.prop">
                <el-form-item :label="f.label">
                  <el-input v-if="f.type==='input'" v-model="form[f.prop]" />
                  <el-input-number v-else-if="f.type==='number'" v-model="form[f.prop]" :controls="false" style="width:100%" />
                  <el-select v-else-if="f.type==='select'" v-model="form[f.prop]" placeholder="请选择" style="width:100%">
                    <el-option v-for="o in f.options" :key="o" :label="o" :value="o" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-collapse-item>

          <el-collapse-item title="空调系统信息" name="ac">
            <el-row :gutter="16">
              <el-col :span="12" v-for="f in fields.ac" :key="f.prop">
                <el-form-item :label="f.label">
                  <el-input v-if="f.type==='input'" v-model="form[f.prop]" />
                  <el-input-number v-else-if="f.type==='number'" v-model="form[f.prop]" :controls="false" style="width:100%" />
                  <el-select v-else-if="f.type==='select'" v-model="form[f.prop]" placeholder="请选择" style="width:100%">
                    <el-option v-for="o in f.options" :key="o" :label="o" :value="o" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-collapse-item>
        </el-collapse>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">关闭</el-button>
        <el-button v-if="formMode !== 'view'" type="primary" @click="onSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 设备概况配置 弹窗（Tab 动态列表） -->
    <el-dialog v-model="deviceVisible" title="设备概况配置" width="95%" top="3vh" :close-on-click-modal="false">
      <el-tabs v-model="activeDeviceTab">
        <el-tab-pane v-for="tab in deviceTabs" :key="tab.key" :label="tab.label" :name="tab.key">
          <div style="margin-bottom:8px;">
            <el-button type="primary" size="small" :icon="Plus" @click="addDeviceRow(tab.key)" :disabled="deviceDisabled">新增</el-button>
            <span class="form-section-tip" style="margin-left:8px;">共 {{ (deviceData[tab.key]||[]).length }} 条</span>
          </div>
          <el-table :data="deviceData[tab.key] || []" border size="small" max-height="380">
            <el-table-column type="index" label="#" width="50" />
            <el-table-column v-for="f in tab.fields" :key="f.prop" :label="f.label" :min-width="f.minWidth||140">
              <template #default="{ row, $index }">
                <el-input v-if="f.type==='input'" v-model="row[f.prop]" :disabled="deviceDisabled" size="small" />
                <el-input-number v-else-if="f.type==='number'" v-model="row[f.prop]" :controls="false" :disabled="deviceDisabled" size="small" style="width:100%" />
                <el-select v-else-if="f.type==='select'" v-model="row[f.prop]" :disabled="deviceDisabled" size="small" style="width:100%">
                  <el-option v-for="o in f.options" :key="o" :label="o" :value="o" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ $index }">
                <el-button v-if="!deviceDisabled" link type="danger" :icon="Delete" @click="removeDeviceRow(tab.key, $index)">删除</el-button>
                <span v-else class="form-section-tip">只读</span>
              </template>
            </el-table-column>
            <template #empty><div class="device-list-empty">暂无数据，点击“新增”添加</div></template>
          </el-table>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="deviceVisible = false">关闭</el-button>
        <el-button v-if="!deviceDisabled" type="primary" @click="onDeviceSubmit">保存</el-button>
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
    const SetUp = ElementPlusIconsVue.SetUp;

    const opts = {
      projectType: ['数据中心', '工业建筑', '商业建筑', '其他'],
      buildingUse: ['办公', '商业', '医疗', '教育', '数据中心']
    };

    // 表单字段定义
    const fields = {
      basic: [
        { label: '项目编号', prop: 'projectNo', type: 'input' },
        { label: '项目名称', prop: 'projectName', type: 'input' },
        { label: '项目类型', prop: 'projectType', type: 'select', options: opts.projectType },
        { label: '建筑面积(㎡)', prop: 'buildingArea', type: 'number' },
        { label: '建筑用途', prop: 'buildingUse', type: 'select', options: opts.buildingUse }
      ],
      electricity: [
        { label: '电价类型', prop: 'priceType', type: 'select', options: ['单一电价', '分时电价', '需量电价'] },
        { label: '基础电价（平电价）', prop: 'basePrice', type: 'number' },
        { label: '峰电价', prop: 'peakPrice', type: 'number' },
        { label: '谷电价', prop: 'valleyPrice', type: 'number' },
        { label: '峰时段时段', prop: 'peakPeriod', type: 'input' },
        { label: '谷时段时段', prop: 'valleyPeriod', type: 'input' },
        { label: '需量电价', prop: 'demandPrice', type: 'number' },
        { label: '需量电费阈值', prop: 'demandThreshold', type: 'number' }
      ],
      ac: [
        { label: '冷水机组数量', prop: 'chillerCount', type: 'number' },
        { label: '冷冻泵数量', prop: 'chilledPumpCount', type: 'number' },
        { label: '冷却泵数量', prop: 'coolingPumpCount', type: 'number' },
        { label: '冷却塔数量', prop: 'coolingTowerCount', type: 'number' },
        { label: '冷冻水供水温度下限', prop: 'chwSupplyTempMin', type: 'number' },
        { label: '冷冻水供水温度上限', prop: 'chwSupplyTempMax', type: 'number' },
        { label: '冷冻水压差旁通设定值', prop: 'chwBypassSet', type: 'number' },
        { label: '冷冻水最小供回水压差', prop: 'chwMinDiffPressure', type: 'number' },
        { label: '冷冻水回水温度下限', prop: 'chwReturnTempMin', type: 'number' },
        { label: '冷冻水回水温度上限', prop: 'chwReturnTempMax', type: 'number' },
        { label: '冷却水进水温度上限', prop: 'cwInletTempMax', type: 'number' },
        { label: '冷冻水出水温度额定值', prop: 'chwOutletTempRated', type: 'number' },
        { label: '冷冻水回水温度额定值', prop: 'chwReturnTempRated', type: 'number' },
        { label: '冷却水进水温度额定值', prop: 'cwInletTempRated', type: 'number' },
        { label: '冷却水出水温度额定值', prop: 'cwOutletTempRated', type: 'number' },
        { label: '冷冻水供水管直径', prop: 'chwSupplyPipeDia', type: 'number' },
        { label: '冷冻水回水管直径', prop: 'chwReturnPipeDia', type: 'number' },
        { label: '冷却水供水管直径', prop: 'cwSupplyPipeDia', type: 'number' },
        { label: '冷却水回水管直径', prop: 'cwReturnPipeDia', type: 'number' },
        { label: '最不利末端压差目标值', prop: 'worstDiffPressureTarget', type: 'number' },
        { label: '最不利末端温度目标值', prop: 'worstTempTarget', type: 'number' },
        { label: '最不利末端湿度目标值', prop: 'worstHumidityTarget', type: 'number' }
      ]
    };

    // 设备概况 Tab 字段定义
    const deviceTabs = [
      {
        key: 'chiller', label: '冷水机组',
        fields: [
          { label: '设备编号', prop: 'deviceNo', type: 'input' },
          { label: '设备类型', prop: 'deviceType', type: 'input' },
          { label: '设备状态', prop: 'deviceStatus', type: 'select', options: ['运行', '停机', '故障'] },
          { label: '额定制冷量(kW)', prop: 'ratedCooling', type: 'number' },
          { label: '额定功率(kW)', prop: 'ratedPower', type: 'number' },
          { label: '最小负载率', prop: 'minLoadRate', type: 'number' },
          { label: '性能系数COP', prop: 'cop', type: 'number' },
          { label: '制冷剂类型', prop: 'refrigerantType', type: 'input' }
        ]
      },
      {
        key: 'chilledPump', label: '冷冻泵',
        fields: [
          { label: '频率下限(Hz)', prop: 'freqMin', type: 'number' },
          { label: '额定扬程(m)', prop: 'ratedHead', type: 'number' },
          { label: '额定流量(m³/h)', prop: 'ratedFlow', type: 'number' },
          { label: '额定功率(kW)', prop: 'ratedPower', type: 'number' }
        ]
      },
      {
        key: 'coolingPump', label: '冷却泵',
        fields: [
          { label: '频率下限(Hz)', prop: 'freqMin', type: 'number' },
          { label: '额定扬程(m)', prop: 'ratedHead', type: 'number' },
          { label: '额定流量(m³/h)', prop: 'ratedFlow', type: 'number' },
          { label: '额定功率(kW)', prop: 'ratedPower', type: 'number' }
        ]
      },
      {
        key: 'coolingTower', label: '冷却塔',
        fields: [
          { label: '频率下限(Hz)', prop: 'freqMin', type: 'number' },
          { label: '冷却塔额定冷却能力(kW)', prop: 'ratedCooling', type: 'number' },
          { label: '冷却塔额定水流量(m³/h)', prop: 'ratedWaterFlow', type: 'number' },
          { label: '冷却塔额定空气流量(m³/h)', prop: 'ratedAirFlow', type: 'number' },
          { label: '冷却塔风机额定功率(kW)', prop: 'ratedFanPower', type: 'number' }
        ]
      }
    ];

    const makeForm = () => {
      const o = { id: undefined };
      [...fields.basic, ...fields.electricity, ...fields.ac].forEach(f => { o[f.prop] = null; });
      return o;
    };

    const filters = reactive({ projectType: '', buildingUse: '', keyword: '' });
    const page = reactive({ current: 1, size: 10 });

    // 模拟数据
    const tableData = ref([
      { id: 1, projectNo: 'P2024001', projectName: '上海某数据中心A', projectType: '数据中心', buildingArea: 35000, buildingUse: '数据中心' },
      { id: 2, projectNo: 'P2024002', projectName: '苏州商业广场B', projectType: '商业建筑', buildingArea: 82000, buildingUse: '商业' },
      { id: 3, projectNo: 'P2024003', projectName: '北京办公大楼C', projectType: '工业建筑', buildingArea: 46000, buildingUse: '办公' },
      { id: 4, projectNo: 'P2024004', projectName: '广州医疗中心D', projectType: '商业建筑', buildingArea: 58000, buildingUse: '医疗' },
      { id: 5, projectNo: 'P2024005', projectName: '深圳教育园区E', projectType: '其他', buildingArea: 67000, buildingUse: '教育' },
      { id: 6, projectNo: 'P2024006', projectName: '杭州数据中心F', projectType: '数据中心', buildingArea: 42000, buildingUse: '数据中心' },
      { id: 7, projectNo: 'P2024007', projectName: '成都商业综合体G', projectType: '商业建筑', buildingArea: 95000, buildingUse: '商业' }
    ]);

    const filteredData = computed(() => {
      return tableData.value.filter(r => {
        if (filters.projectType && r.projectType !== filters.projectType) return false;
        if (filters.buildingUse && r.buildingUse !== filters.buildingUse) return false;
        if (filters.keyword) {
          const k = filters.keyword.toLowerCase();
          if (!(r.projectNo.toLowerCase().includes(k) || r.projectName.toLowerCase().includes(k))) return false;
        }
        return true;
      });
    });
    const pagedData = computed(() => {
      const start = (page.current - 1) * page.size;
      return filteredData.value.slice(start, start + page.size);
    });

    const onSearch = () => { page.current = 1; };
    const onReset = () => { filters.projectType = ''; filters.buildingUse = ''; filters.keyword = ''; page.current = 1; };

    // 创建/编辑/查看
    const formVisible = ref(false);
    const formMode = ref('create'); // create / edit / view
    const form = reactive(makeForm());
    const activeNames = ref(['basic', 'electricity', 'ac']);

    const openCreate = () => {
      Object.assign(form, makeForm());
      formMode.value = 'create';
      formVisible.value = true;
    };
    const openEdit = (row) => {
      Object.assign(form, makeForm(), row);
      formMode.value = 'edit';
      formVisible.value = true;
    };
    const openView = (row) => {
      Object.assign(form, makeForm(), row);
      formMode.value = 'view';
      formVisible.value = true;
    };
    const onSubmit = () => {
      if (formMode.value === 'create') {
        const id = Math.max(0, ...tableData.value.map(r => r.id)) + 1;
        tableData.value.push({ ...form, id });
        ElementPlus.ElMessage.success('创建成功');
      } else {
        const idx = tableData.value.findIndex(r => r.id === form.id);
        if (idx > -1) tableData.value[idx] = { ...form };
        ElementPlus.ElMessage.success('保存成功');
      }
      formVisible.value = false;
    };
    const onDelete = (row) => {
      ElementPlus.ElMessageBox.confirm('确认删除该项目信息？', '提示', { type: 'warning' })
        .then(() => {
          const idx = tableData.value.findIndex(r => r.id === row.id);
          if (idx > -1) tableData.value.splice(idx, 1);
          ElementPlus.ElMessage.success('删除成功');
        }).catch(() => {});
    };

    // 设备概况
    const deviceVisible = ref(false);
    const deviceDisabled = ref(false);
    const activeDeviceTab = ref('chiller');
    const deviceData = reactive({ chiller: [], chilledPump: [], coolingPump: [], coolingTower: [] });
    let currentDeviceRow = null;

    const openDevice = (row) => {
      currentDeviceRow = row;
      deviceDisabled.value = false;
      // 模拟已存数据
      deviceData.chiller = [
        { deviceNo: 'CH-01', deviceType: '离心式冷水机组', deviceStatus: '运行', ratedCooling: 1200, ratedPower: 220, minLoadRate: 0.2, cop: 5.5, refrigerantType: 'R134a' }
      ];
      deviceData.chilledPump = [{ freqMin: 25, ratedHead: 32, ratedFlow: 200, ratedPower: 30 }];
      deviceData.coolingPump = [{ freqMin: 25, ratedHead: 28, ratedFlow: 250, ratedPower: 37 }];
      deviceData.coolingTower = [{ freqMin: 20, ratedCooling: 1400, ratedWaterFlow: 300, ratedAirFlow: 80000, ratedFanPower: 15 }];
      deviceVisible.value = true;
    };
    const addDeviceRow = (key) => {
      const row = {};
      deviceTabs.find(t => t.key === key).fields.forEach(f => { row[f.prop] = null; });
      deviceData[key].push(row);
    };
    const removeDeviceRow = (key, idx) => { deviceData[key].splice(idx, 1); };
    const onDeviceSubmit = () => { ElementPlus.ElMessage.success('设备概况已保存'); deviceVisible.value = false; };

    return {
      Search, RefreshLeft, Plus, Edit, View, Delete, SetUp,
      opts, fields, filters, page, tableData, filteredData, pagedData,
      onSearch, onReset,
      formVisible, formMode, form, activeNames,
      openCreate, openEdit, openView, onSubmit, onDelete,
      deviceTabs, deviceVisible, deviceDisabled, activeDeviceTab, deviceData,
      openDevice, addDeviceRow, removeDeviceRow, onDeviceSubmit
    };
  }
};
