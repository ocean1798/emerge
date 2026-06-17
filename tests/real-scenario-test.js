/**
 * Emerge Web 真实场景测试集
 *
 * 使用方法：
 *   node tests/real-scenario-test.js
 *
 * 前置条件：
 *   1. 启动 Emerge 开发服务器: npm run dev
 *   2. 确保 Ollama 服务运行: ollama serve
 *   3. 确保 qwen3-embedding:8b 模型已下载: ollama pull qwen3-embedding:8b
 */

const API_BASE = 'http://127.0.0.1:8787';

// 测试文件数据
const TEST_FILES = [
  {
    name: "项目需求文档.md",
    content: `# Emerge 项目需求文档

## 1. 项目背景
Emerge 是一个本地优先的语义资产管理工具，旨在帮助用户管理个人知识库。

## 2. 核心功能
- **对象管理**: 支持导入文件、笔记、URL
- **语义搜索**: 基于向量和词法的混合检索
- **Ask 功能**: 使用 LLM 回答用户问题
- **操作追踪**: 记录所有操作历史

## 3. 技术架构
- 前端: React + TypeScript + Vite
- 后端: Node.js + Express
- 向量库: 本地 JSON 存储
- 嵌入模型: Ollama qwen3-embedding:8b

## 4. MVP 目标
- 支持基本的文件导入和搜索
- 实现混合检索（词法 + 向量）
- 集成 LLM 进行问答
`
  },
  {
    name: "会议记录.txt",
    content: `2026-06-16 项目进度会议

参会人员: 产品经理、开发工程师、测试工程师

## 议题 1: MVP 进度
- 已完成 24 个迭代
- 核心功能全部实现
- 需要进行最终测试

## 议题 2: 技术问题
- 向量检索性能需要优化
- 大文件导入需要优化
- API key 安全存储方案

## 议题 3: 下一步计划
- 完成 MVP 测试
- 修复已知问题
- 准备发布

## 决定
- 本周完成测试
- 下周发布 MVP
`
  },
  {
    name: "技术方案.txt",
    content: `混合检索技术方案

## 1. 检索策略
采用 RRF (Reciprocal Rank Fusion) 算法融合词法和向量检索结果。

## 2. 词法检索
使用 TF-IDF 算法进行关键词匹配，支持中文分词。

## 3. 向量检索
使用 Ollama 的 qwen3-embedding:8b 模型生成文档向量，使用余弦相似度计算相似度。

## 4. 融合算法
RRF 公式: score = 1 / (k + rank)
其中 k=60，rank 是检索结果的排名。

## 5. 优势
- 结合关键词精确匹配和语义相似度
- 对查询词的变化有鲁棒性
- 不需要训练数据
`
  },
  {
    name: "数据表格.csv",
    content: `姓名,部门,职位,入职日期
张三,技术部,高级工程师,2024-01-15
李四,产品部,产品经理,2024-03-20
王五,设计部,UI设计师,2024-02-10
赵六,技术部,前端开发,2024-04-01
钱七,市场部,市场总监,2024-01-05`
  },
  {
    name: "配置文件.json",
    content: `{
  "app": {
    "name": "Emerge",
    "version": "1.0.0",
    "description": "本地优先的语义资产管理工具"
  },
  "features": {
    "hybridSearch": true,
    "vectorIndex": true,
    "askFunction": true
  },
  "models": {
    "llm": "deepseek-v4-flash",
    "embedding": "qwen3-embedding:8b"
  }
}`
  },
  {
    name: "网页示例.html",
    content: `<!DOCTYPE html>
<html>
<head>
  <title>Emerge 项目介绍</title>
</head>
<body>
  <h1>Emerge - 本地优先的语义资产管理工具</h1>
  <p>Emerge 是一个帮助用户管理个人知识库的工具。</p>

  <h2>核心功能</h2>
  <ul>
    <li>对象管理：支持导入文件、笔记、URL</li>
    <li>语义搜索：基于向量和词法的混合检索</li>
    <li>Ask 功能：使用 LLM 回答用户问题</li>
  </ul>

  <h2>技术架构</h2>
  <table>
    <tr><td>前端</td><td>React + TypeScript + Vite</td></tr>
    <tr><td>后端</td><td>Node.js + Express</td></tr>
    <tr><td>向量库</td><td>本地 JSON 存储</td></tr>
  </table>
</body>
</html>`
  }
];

// 测试用例
const TEST_QUERIES = [
  {
    question: "MVP 的目标是什么？",
    expectedKeywords: ["文件导入", "搜索", "混合检索", "LLM"]
  },
  {
    question: "项目的技术架构是什么？",
    expectedKeywords: ["React", "Node.js", "Ollama", "qwen3-embedding"]
  },
  {
    question: "混合检索使用什么算法？",
    expectedKeywords: ["RRF", "Reciprocal Rank Fusion"]
  },
  {
    question: "下一步计划是什么？",
    expectedKeywords: ["测试", "发布", "MVP"]
  },
  {
    question: "公司有哪些部门？",
    expectedKeywords: ["技术部", "产品部", "设计部", "市场部"]
  },
  {
    question: "Emerge 的版本号是多少？",
    expectedKeywords: ["1.0.0"]
  }
];

// 辅助函数
async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  return res.json();
}

function log(level, message, data = null) {
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warn: '⚠️'
  }[level] || 'ℹ️';

  console.log(`${prefix} ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// 测试函数
async function testHealth() {
  log('info', '测试 API 健康检查...');
  const health = await fetchJSON(`${API_BASE}/api/health`);

  if (health.ok) {
    log('success', 'API 健康检查通过');
    return true;
  } else {
    log('error', 'API 健康检查失败');
    return false;
  }
}

async function testFileImport() {
  log('info', '测试文件导入...');
  const results = [];

  for (const file of TEST_FILES) {
    try {
      const result = await fetchJSON(`${API_BASE}/api/ingest`, {
        method: 'POST',
        body: JSON.stringify({
          title: file.name,
          content: file.content,
          source_uri: `test://files/${file.name}`,
          mime_type: 'text/plain'
        })
      });

      if (result.ok) {
        log('success', `导入成功: ${file.name}`, { asset_id: result.asset?.asset_id });
        results.push({ file: file.name, success: true, asset_id: result.asset?.asset_id });
      } else {
        log('error', `导入失败: ${file.name}`, result);
        results.push({ file: file.name, success: false, error: result.error });
      }
    } catch (e) {
      log('error', `导入异常: ${file.name}`, { error: e.message });
      results.push({ file: file.name, success: false, error: e.message });
    }
  }

  const successCount = results.filter(r => r.success).length;
  log('info', `文件导入完成: ${successCount}/${TEST_FILES.length} 成功`);

  return results;
}

async function testIndexStatus() {
  log('info', '测试索引状态...');
  const index = await fetchJSON(`${API_BASE}/api/index/status`);

  if (index.ok) {
    log('success', '索引状态查询成功', {
      totalChunks: index.totalChunks,
      embeddedChunks: index.embeddedChunks,
      lexicalChunks: index.lexicalChunks,
      currentModel: index.currentModel
    });

    // 验证向量索引
    if (index.embeddedChunks > 0 && index.lexicalChunks === 0) {
      log('success', '向量索引验证通过: 所有 chunks 都有向量嵌入');
    } else {
      log('warn', '向量索引可能不完整', {
        embeddedChunks: index.embeddedChunks,
        lexicalChunks: index.lexicalChunks
      });
    }

    return index;
  } else {
    log('error', '索引状态查询失败');
    return null;
  }
}

async function testSearch() {
  log('info', '测试搜索功能...');
  const results = [];

  const queries = ['MVP', '混合检索', '会议', '技术架构'];

  for (const query of queries) {
    try {
      const search = await fetchJSON(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`);

      if (search.results && search.results.length > 0) {
        log('success', `搜索 "${query}" 成功`, {
          resultsCount: search.results.length,
          topResult: search.results[0]?.label,
          retrievalMode: search.retrieval?.mode
        });
        results.push({ query, success: true, count: search.results.length });
      } else {
        log('warn', `搜索 "${query}" 无结果`);
        results.push({ query, success: false, count: 0 });
      }
    } catch (e) {
      log('error', `搜索 "${query}" 异常`, { error: e.message });
      results.push({ query, success: false, error: e.message });
    }
  }

  return results;
}

async function testAsk() {
  log('info', '测试 Ask 功能...');
  const results = [];

  for (const testCase of TEST_QUERIES) {
    try {
      const ask = await fetchJSON(`${API_BASE}/api/ask`, {
        method: 'POST',
        body: JSON.stringify({ question: testCase.question })
      });

      if (ask.answer) {
        // 验证回答是否包含期望的关键词
        const matchedKeywords = testCase.expectedKeywords.filter(kw =>
          ask.answer.includes(kw)
        );

        log('success', `Ask "${testCase.question}" 成功`, {
          provider: ask.provider,
          model: ask.model,
          retrievalMode: ask.retrieval?.mode,
          citationsCount: ask.citations?.length || 0,
          answerPreview: ask.answer.substring(0, 100) + '...',
          matchedKeywords: matchedKeywords.length + '/' + testCase.expectedKeywords.length
        });

        results.push({
          question: testCase.question,
          success: true,
          matchedKeywords: matchedKeywords.length,
          totalKeywords: testCase.expectedKeywords.length
        });
      } else {
        log('error', `Ask "${testCase.question}" 失败`, ask);
        results.push({ question: testCase.question, success: false, error: ask.error });
      }
    } catch (e) {
      log('error', `Ask "${testCase.question}" 异常`, { error: e.message });
      results.push({ question: testCase.question, success: false, error: e.message });
    }
  }

  return results;
}

async function testHistory() {
  log('info', '测试 History 记录...');

  const askHistory = await fetchJSON(`${API_BASE}/api/history/ask`);
  const searchHistory = await fetchJSON(`${API_BASE}/api/history/search`);

  log('success', 'History 查询成功', {
    askHistoryCount: askHistory.runs?.length || 0,
    searchHistoryCount: searchHistory.runs?.length || 0
  });

  return {
    askHistory: askHistory.runs?.length || 0,
    searchHistory: searchHistory.runs?.length || 0
  };
}

// 主测试函数
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('Emerge Web 真实场景测试');
  console.log('='.repeat(60) + '\n');

  const results = {
    health: false,
    import: [],
    index: null,
    search: [],
    ask: [],
    history: null
  };

  // 1. 健康检查
  results.health = await testHealth();
  if (!results.health) {
    log('error', 'API 不可用，测试终止');
    process.exit(1);
  }

  console.log('\n' + '-'.repeat(60) + '\n');

  // 2. 文件导入
  results.import = await testFileImport();

  console.log('\n' + '-'.repeat(60) + '\n');

  // 3. 索引状态
  results.index = await testIndexStatus();

  console.log('\n' + '-'.repeat(60) + '\n');

  // 4. 搜索测试
  results.search = await testSearch();

  console.log('\n' + '-'.repeat(60) + '\n');

  // 5. Ask 测试
  results.ask = await testAsk();

  console.log('\n' + '-'.repeat(60) + '\n');

  // 6. History 测试
  results.history = await testHistory();

  // 测试总结
  console.log('\n' + '='.repeat(60));
  console.log('测试总结');
  console.log('='.repeat(60) + '\n');

  const summary = {
    'API 健康检查': results.health ? '✅ 通过' : '❌ 失败',
    '文件导入': `${results.import.filter(r => r.success).length}/${results.import.length} 成功`,
    '向量索引': results.index?.embeddedChunks > 0 ? '✅ 已生成' : '❌ 未生成',
    '混合检索': results.index?.lexicalChunks === 0 ? '✅ 全部向量' : '⚠️ 存在词法',
    '搜索测试': `${results.search.filter(r => r.success).length}/${results.search.length} 成功`,
    'Ask 测试': `${results.ask.filter(r => r.success).length}/${results.ask.length} 成功`,
    'Ask History': `${results.history?.askHistory || 0} 条记录`,
    'Search History': `${results.history?.searchHistory || 0} 条记录`
  };

  for (const [key, value] of Object.entries(summary)) {
    console.log(`${key}: ${value}`);
  }

  console.log('\n' + '='.repeat(60));

  // 返回结果供外部使用
  return results;
}

// 如果直接运行此脚本
if (typeof process !== 'undefined' && process.argv) {
  runTests().catch(console.error);
}

// 导出供其他脚本使用
if (typeof module !== 'undefined') {
  module.exports = { runTests, TEST_FILES, TEST_QUERIES };
}
