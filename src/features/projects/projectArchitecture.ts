import type { ArchiveLocale, ProjectRecord } from "@/lib/content/types";

export type ArchitectureModel =
  | "client" | "mobile" | "service" | "workers" | "queue" | "database"
  | "cache" | "storage" | "external" | "package" | "repository";

export type ArchitectureNode = Readonly<{
  id: string;
  label: string;
  description: string;
  kind: string;
  model: ArchitectureModel;
  scale: number;
  emphasis: "primary" | "secondary" | "support";
  tags: readonly string[];
  position: readonly [number, number, number];
  documents: readonly string[];
}>;

export type ArchitectureEdge = Readonly<{
  from: string;
  to: string;
  label: string;
  planned?: boolean;
}>;

export type ArchitectureFlowStep = Readonly<{
  from: string;
  to: string;
  title: string;
  description: string;
}>;

export type ArchitectureFlow = Readonly<{
  id: string;
  label: string;
  description: string;
  nodes: readonly string[];
  documents: readonly string[];
  steps?: readonly ArchitectureFlowStep[];
}>;

export type ArchitectureGroup = Readonly<{
  id: string;
  label: string;
  description: string;
  position: readonly [number, number, number];
  size: readonly [width: number, depth: number];
  nodes: readonly string[];
}>;

export type ProjectArchitecture = Readonly<{
  kind: "system" | "package";
  nodes: readonly ArchitectureNode[];
  edges: readonly ArchitectureEdge[];
  flows: readonly ArchitectureFlow[];
  groups: readonly ArchitectureGroup[];
}>;

type LocalizedText = readonly [zh: string, en: string];
type NodeDefinition = Omit<ArchitectureNode, "description" | "kind" | "tags"> & Readonly<{
  description: LocalizedText;
  kind: LocalizedText;
  tags: readonly LocalizedText[];
}>;
type EdgeDefinition = Omit<ArchitectureEdge, "label"> & Readonly<{ label: LocalizedText }>;
type FlowStepDefinition = Omit<ArchitectureFlowStep, "title" | "description"> & Readonly<{
  title: LocalizedText;
  description: LocalizedText;
}>;
type FlowDefinition = Omit<ArchitectureFlow, "label" | "description" | "steps"> & Readonly<{
  label: LocalizedText;
  description: LocalizedText;
  steps?: readonly FlowStepDefinition[];
}>;
type GroupDefinition = Omit<ArchitectureGroup, "label" | "description"> & Readonly<{
  label: LocalizedText;
  description: LocalizedText;
}>;
type ArchitectureDefinition = Readonly<{
  nodes: readonly NodeDefinition[];
  edges: readonly EdgeDefinition[];
  flows: readonly FlowDefinition[];
  groups: readonly GroupDefinition[];
}>;

// Source: README, technical-design and module-document excerpts curated in
// src/content/{zh,en}/projects.json. Each object is a real service, dependency or
// package boundary; tags describe capabilities inside it, never extra services.
// X/Z are the horizontal ground plane; Y is the base elevation of a 3D model.
// Contained models sit 0.2 units above their group's platform center. Vertical
// layers and model scale express ownership and importance, not service capacity.
// These maps summarize logical architecture, not host/replica deployment topology.
// Urban's future online quality reranking is explicitly a planned relationship.
// Playback follows illustrative successful paths, not recorded production traffic.
// OCR stage ownership and direct Python knowledge-index writes are cross-checked
// against financial-management-ai/docs/OCR_PIPELINE.md and
// ai-python/app/ocr/{handlers/embedding_index_handler,services/vector_store}.py.
const architectures: Readonly<Record<string, ArchitectureDefinition>> = {
  "financial-management-ai": {
    groups: [
      {
        id: "intelligence", label: ["智能工作流", "Intelligence workflows"],
        description: ["Python 统一承载 Agent、OCR、Embedding、场景计算与报告工作流，是智能能力的主要边界。", "Python owns Agent, OCR, embedding, scene processing and report workflows as the primary intelligence boundary."],
        position: [2.645, 2.1, -1.058], size: [4.8, 4], nodes: ["workers"],
      },
      {
        id: "application", label: ["Java 业务边界", "Java application boundary"],
        description: ["认证、用户资产、会话与授权数据网关保留在 Java 业务侧。", "Identity, user assets, sessions and the authorized data gateway remain on the Java application side."],
        position: [-3.9675, 0.6, 0], size: [3.6, 3.6], nodes: ["core"],
      },
      {
        id: "data", label: ["数据底座", "Data foundation"],
        description: ["关系与向量数据、行情时序和文件产物支撑上层业务与智能工作流，各自保持存储职责。", "Relational and vector data, market series and file artifacts support the application and intelligence layers with separate storage responsibilities."],
        position: [0, -2.2, 0], size: [11.935, 3.4], nodes: ["database", "timeseries", "storage"],
      },
    ],
    nodes: [
      {
        id: "client", label: "Vue Workbench", model: "client", position: [-7.935, 0.8, 3.9675], scale: 0.7, emphasis: "support",
        description: ["Vue 3 研究界面，展示行情、知识库、任务进度与 AI 回答。", "Vue 3 research interface for markets, knowledge, task progress and AI answers."],
        kind: ["客户端", "Client"], tags: [["研究会话", "Research chat"], ["知识库", "Knowledge"]], documents: [],
      },
      {
        id: "core", label: "Spring Boot", model: "service", position: [-3.9675, 0.8, 0], scale: 1.25, emphasis: "secondary",
        description: ["Java 持有认证、业务数据、AI 会话和任务状态；Python 通过签名网关获取授权数据。", "Java owns identity, business data, AI sessions and task state; Python retrieves authorized data through a signed gateway."],
        kind: ["业务服务", "Application service"],
        tags: [["身份与权限", "Identity"], ["会话编排", "Sessions"], ["数据网关", "Data gateway"]],
        documents: ["backend-java/finance-ai/README.md", "docs/superpowers/specs/2026-06-09-ai-agent-domain-toolcalling-design.md", "docs/superpowers/specs/2026-06-11-investor-psychological-profile-design.md"],
      },
      {
        id: "queue", label: "RabbitMQ", model: "queue", position: [-0.39675, 1, 3.30625], scale: 0.65, emphasis: "secondary",
        description: ["承载 Agent 与 OCR/报告阶段消息，以重试队列和死信机制隔离长任务。", "Carries Agent and OCR/report stage messages, with retry queues and dead-letter handling for long tasks."],
        kind: ["消息中间件", "Message broker"], tags: [["异步任务", "Async tasks"], ["重试 / 死信", "Retry / DLX"]],
        documents: ["docs/OCR_PIPELINE.md", "docs/AI_CHAT_AGENT_ARCHITECTURE.md"],
      },
      {
        id: "workers", label: "Python Workers", model: "workers", position: [2.645, 2.3, -1.058], scale: 1.6, emphasis: "primary",
        description: ["LangGraph Agent、OCR 阶段、Embedding 与场景处理运行在 Python；Agent 业务取数经 Java 授权，OCR 独立写入知识索引。", "Python runs LangGraph, OCR, embeddings and scene processing. Agent business reads go through Java; OCR writes the knowledge index directly."],
        kind: ["智能工作流", "AI workers"], tags: [["LangGraph", "LangGraph"], ["OCR / Embedding", "OCR / Embedding"], ["场景计算", "Scene signals"]],
        documents: ["docs/AI_CHAT_AGENT_ARCHITECTURE.md", "docs/标的标签计算规则.md", "docs/REPORT_PIPELINE.md", "docs/OCR_PIPELINE.md", "docs/chunk入库打标签文档.md", "docs/superpowers/specs/2026-06-10-ai-agent-tool-calling-rag-design.md", "docs/superpowers/specs/2026-06-11-investor-psychological-profile-design.md"],
      },
      {
        id: "database", label: "PostgreSQL", model: "database", position: [-3.9675, -2, 0], scale: 0.55, emphasis: "support",
        description: ["存储结构化业务数据与 pgvector 知识向量；Java 负责授权检索，Python OCR 写入知识向量和阶段状态。", "Stores business records and pgvector knowledge. Java authorizes retrieval; Python OCR writes knowledge vectors and stage state."],
        kind: ["关系与向量存储", "Relational / vector store"], tags: [["pgvector", "pgvector"], ["业务记录", "Business records"]],
        documents: [],
      },
      {
        id: "timeseries", label: "InfluxDB", model: "database", position: [0, -2, 0], scale: 0.55, emphasis: "support",
        description: ["承载系统行情等时序数据，与 PostgreSQL 的结构化数据职责分开。", "Stores time-series data alongside the separate structured-data responsibilities of PostgreSQL."],
        kind: ["时序存储", "Time-series store"], tags: [["行情时序", "Market series"]], documents: [],
      },
      {
        id: "storage", label: "MinIO", model: "storage", position: [3.9675, -2, 0], scale: 0.55, emphasis: "support",
        description: ["保存原始文件、识别产物和审核版本，使 OCR 阶段可追溯、可恢复。", "Preserves source files, recognition artifacts and reviewed versions for traceable, recoverable OCR stages."],
        kind: ["对象存储", "Object storage"], tags: [["原始文件", "Source files"], ["阶段产物", "Stage artifacts"]],
        documents: ["docs/OCR_PIPELINE.md"],
      },
      {
        id: "models", label: "DeepSeek / Qwen", model: "external", position: [7.27375, 2, -3.30625], scale: 0.75, emphasis: "support",
        description: ["外部模型能力支持文本分析与 Qwen-VL 图像识别；模型不直接持有业务数据库权限。", "External model capabilities support text analysis and Qwen-VL recognition without direct business-database privileges."],
        kind: ["模型服务", "Model services"], tags: [["文本推理", "Text reasoning"], ["视觉识别", "Vision OCR"]],
        documents: ["docs/OCR_PIPELINE.md"],
      },
    ],
    edges: [
      { from: "client", to: "core", label: ["REST / WebSocket", "REST / WebSocket"] },
      { from: "core", to: "queue", label: ["任务与阶段消息", "Task and stage messages"] },
      { from: "queue", to: "workers", label: ["消费异步任务", "Consume async tasks"] },
      { from: "workers", to: "core", label: ["签名工具请求 / 回调", "Signed tool requests / callbacks"] },
      { from: "core", to: "database", label: ["业务数据 / 向量候选", "Business data / vector candidates"] },
      { from: "workers", to: "database", label: ["OCR 知识索引 / 阶段状态", "OCR knowledge index / stage state"] },
      { from: "core", to: "timeseries", label: ["时序读写", "Time-series access"] },
      { from: "workers", to: "storage", label: ["阶段产物读写", "Stage artifact access"] },
      { from: "core", to: "storage", label: ["任务审核产物", "Reviewed task artifacts"] },
      { from: "workers", to: "models", label: ["模型推理 / OCR", "Inference / OCR"] },
      { from: "core", to: "models", label: ["Spring AI ChatClient", "Spring AI ChatClient"] },
    ],
    flows: [
      {
        id: "agent-chat", label: ["Agent 对话", "Agent conversation"],
        steps: [
          { from: "client", to: "core", title: ["提出研究问题", "Ask a research question"],
            description: ["用户在研究会话发送问题；Java 校验身份，并关联本次会话。", "The user sends a research question. Java checks identity and associates the conversation."] },
          { from: "core", to: "queue", title: ["创建 Agent 任务", "Queue the Agent run"],
            description: ["Java 建立 Agent Session，向 RabbitMQ 投递 agent.run.start；签名凭证不会进入模型上下文。", "Java creates an Agent Session and publishes agent.run.start. Signing credentials stay outside model context."] },
          { from: "queue", to: "workers", title: ["唤起 LangGraph", "Start LangGraph"],
            description: ["Python 消费任务，进入 context_gate 与 planner；画像、记忆按需要加载。", "Python consumes the task and enters context_gate and planner, loading profile or memory when needed."] },
          { from: "workers", to: "models", title: ["规划工具调用", "Plan tool calls"],
            description: ["Planner 让模型判断需要哪些证据；此时不向用户输出答案正文。", "The planner asks the model which evidence is needed. It does not stream answer text to the user."] },
          { from: "models", to: "workers", title: ["选择场景工具", "Choose a scene tool"],
            description: ["本例模型选择场景信号与知识检索；普通闲聊不会必经这条 RAG 路径。", "In this example, the model selects scene signals and knowledge retrieval. Casual chat does not always enter this RAG path."] },
          { from: "workers", to: "core", title: ["请求授权数据", "Request authorized data"],
            description: ["Python 工具以 HMAC 签名调用 Java 数据网关；Java 校验会话、权限与请求范围。", "The Python tool calls the Java gateway with an HMAC signature. Java checks session, authorization and request scope."] },
          { from: "core", to: "database", title: ["读取业务证据", "Read business evidence"],
            description: ["Java 按工具语义读取所需业务记录，限制返回范围；模型不直接查询数据库。", "Java reads the required business records within the tool contract and response limits. The model does not query the database."] },
          { from: "database", to: "core", title: ["返回数据片段", "Return data records"],
            description: ["数据回到 Java，由业务服务组装工具需要的数据包。", "Records return to Java, where the business service assembles the data required by the tool."] },
          { from: "core", to: "workers", title: ["交付场景数据", "Deliver scene data"],
            description: ["授权数据包返回 Python，场景处理器保留完整计算输入，不直接透传给模型。", "Authorized data reaches Python. Scene processors retain full calculation inputs instead of forwarding them to the model."] },
          { from: "workers", to: "workers", title: ["计算场景信号", "Compute scene signals"],
            description: ["Python 展开场景依赖，计算信号，形成 queryText、scenes 与 tags。", "Python resolves scene dependencies, computes signals and builds queryText, scenes and tags."] },
          { from: "workers", to: "core", title: ["检索相关知识", "Retrieve relevant knowledge"],
            description: ["knowledge.search 再经 Java 校验场景、标签与 limit，查询并重排知识候选。", "knowledge.search goes through Java, which checks scenes, tags and limits before retrieving and reranking knowledge candidates."] },
          { from: "core", to: "workers", title: ["返回精简证据", "Return compact evidence"],
            description: ["Java 交付 filename 与 content；本例命中相关知识，无召回时应明确证据不足。", "Java returns filename and content. This example finds relevant knowledge; an empty result must remain an explicit evidence gap."] },
          { from: "workers", to: "models", title: ["生成最终答案", "Generate the final answer"],
            description: ["证据满足要求后，final_stream 使用整理后的上下文生成面向用户的正文。", "Once evidence is sufficient, final_stream uses the assembled context to generate the user-facing answer."] },
          { from: "models", to: "workers", title: ["接收答案流", "Receive the answer stream"],
            description: ["模型正文回到 Python；只有 final_stream 可以产生 answer_delta。", "Model text returns to Python. Only final_stream may emit answer_delta."] },
          { from: "workers", to: "core", title: ["回传增量与结果", "Send deltas and result"],
            description: ["Python 签名回调 Java；增量仅转发，final_answer 才保存会话并记录 Token。", "Python sends signed callbacks to Java. Deltas are forwarded; final_answer persists the message and token usage."] },
          { from: "core", to: "client", title: ["展示完整回答", "Display the complete answer"],
            description: ["Java 经 WebSocket 推送增量和最终答案；页面用完整结果确认这次交互。", "Java forwards deltas and the final answer over WebSocket. The client settles the interaction with the complete result."] },
        ],
        description: ["演示一次命中知识的研究问答：Java 授权，Python 计算场景并调用受控工具，最后流式回传答案。过程为成功路径示意。", "An illustrative successful research question: Java authorizes, Python computes scene signals and calls controlled tools, then streams the answer using retrieved evidence."],
        nodes: ["client", "core", "queue", "workers", "models", "database"],
        documents: ["docs/AI_CHAT_AGENT_ARCHITECTURE.md", "backend-java/finance-ai/README.md", "docs/superpowers/specs/2026-06-09-ai-agent-domain-toolcalling-design.md", "docs/superpowers/specs/2026-06-10-ai-agent-tool-calling-rag-design.md"],
      },
      {
        id: "knowledge-ingest", label: ["知识入库", "Knowledge ingestion"],
        steps: [
          { from: "client", to: "core", title: ["提交知识文本", "Submit knowledge text"],
            description: ["本例从手动知识导入开始：用户检查段落后确认提交，Java 保留 manual_text 来源。", "This example starts with manual knowledge: the user reviews paragraphs and confirms submission. Java retains the manual_text source."] },
          { from: "core", to: "storage", title: ["保存确认版本", "Save the approved version"],
            description: ["Java 保存 reviewed.json；后续标签和向量均以确认后的段落为准。", "Java saves reviewed.json. Subsequent tags and vectors use these confirmed paragraphs."] },
          { from: "core", to: "queue", title: ["投递规则标签任务", "Queue rule tagging"],
            description: ["Java 发布规则标签阶段消息，携带确认产物的位置。", "Java publishes the rule-tagging stage message with the approved artifact reference."] },
          { from: "queue", to: "workers", title: ["读取待处理段落", "Load approved paragraphs"],
            description: ["Python 消费消息并读取 reviewed.json；每个最终段落对应一个 Chunk。", "Python consumes the message and reads reviewed.json. Each final paragraph becomes one chunk."] },
          { from: "workers", to: "workers", title: ["检查规则标签", "Check rule tags"],
            description: ["规则先生成场景与置信度；本例质量门发现弱结果，需要补充标签。", "Rules generate scenes and confidence scores. In this example, the quality gate finds weak results and requests additional tags."] },
          { from: "workers", to: "models", title: ["按需补充标签", "Request optional tagging"],
            description: ["仅对弱结果调用 LLM，并限制在七类标签白名单；规则充分时跳过此步骤。", "Only weak results call the LLM, constrained to the seven-category whitelist. Sufficient rule results skip this step."] },
          { from: "models", to: "workers", title: ["返回候选标签", "Return proposed tags"],
            description: ["模型标签返回 Python，尚不能直接作为最终检索元数据。", "Model tags return to Python. They are not yet final retrieval metadata."] },
          { from: "workers", to: "workers", title: ["回正最终标签", "Correct the final tags"],
            description: ["统一合并、去重与白名单校验，生成 metadata.scenes，准备可供索引的有效 Chunk。", "Tags are merged, deduplicated and checked against the whitelist to form metadata.scenes and prepare valid chunks for indexing."] },
          { from: "workers", to: "storage", title: ["保留阶段产物", "Preserve stage artifacts"],
            description: ["带标签的确认版本保存在 MinIO，供索引阶段读取、追踪与恢复。", "The tagged approved version is retained in MinIO for indexing, tracing and recovery."] },
          { from: "workers", to: "database", title: ["生成向量并入库", "Embed and index knowledge"],
            description: ["Python 读取确认产物并执行 Embedding，按任务重建 knowledge_vector；本例存在可写入的有效 Chunk。", "Python reads the approved artifact, embeds valid chunks and rebuilds knowledge_vector for the task. This example contains valid content to index."] },
          { from: "client", to: "core", title: ["查看入库结果", "Check ingestion results"],
            description: ["用户回到知识库查看结果，查询仍通过 Java 接口。", "The user opens the knowledge library to check results through the Java API."] },
          { from: "core", to: "database", title: ["查询知识记录", "Query knowledge records"],
            description: ["Java 查询当前用户可见的知识记录、场景标签和任务状态。", "Java queries knowledge records, scene tags and task state visible to the current user."] },
          { from: "database", to: "core", title: ["返回索引结果", "Return indexed records"],
            description: ["带来源与标签的知识记录返回业务服务。", "Knowledge records with provenance and tags return to the application service."] },
          { from: "core", to: "client", title: ["知识可以检索", "Knowledge is searchable"],
            description: ["页面展示成功入库的知识；后续 Agent 可通过授权检索获取这些证据。", "The library shows the indexed knowledge. Later Agent runs can retrieve it as authorized evidence."] },
        ],
        description: ["演示确认后的手动知识经规则标签、按需 LLM、回正与 Embedding 进入索引。本例选择需要 LLM 补充标签的成功分支。", "Approved manual knowledge passes rule tagging, optional LLM tagging, correction and embedding. This successful example follows the branch that needs LLM tag assistance."],
        nodes: ["client", "core", "queue", "workers", "models", "storage", "database"],
        documents: ["docs/OCR_PIPELINE.md", "docs/chunk入库打标签文档.md"],
      },
      {
        id: "ocr-processing", label: ["OCR 图片识别", "OCR image recognition"],
        description: ["从图片上传到视觉识别、人工复核和知识索引。演示假设人工确认且规则标签通过，真实任务会等待复核，不自动跳过。", "From image upload through visual recognition and human review to knowledge indexing. This walkthrough assumes human approval and sufficient rule tags; real tasks wait for review."],
        nodes: ["client", "core", "queue", "workers", "models", "storage", "database"],
        documents: ["docs/OCR_PIPELINE.md", "docs/chunk入库打标签文档.md"],
        steps: [
          { from: "client", to: "core", title: ["上传研究图片", "Upload a research image"],
            description: ["本例演示图片成功识别并获人工确认的路径；PDF 使用 OpenDataLoader，走不同识别分支。", "This example follows a successfully recognized and human-approved image. PDFs use the separate OpenDataLoader recognition branch."] },
          { from: "core", to: "storage", title: ["保存原始文件", "Preserve the source file"],
            description: ["Java 校验文件并写入 MinIO，创建可追踪的 OCR 任务。", "Java validates the file, saves it in MinIO and creates a traceable OCR task."] },
          { from: "core", to: "queue", title: ["启动标准化阶段", "Queue normalization"],
            description: ["Java 发布 document.normalize；长任务通过阶段消息推进。", "Java publishes document.normalize. Stage messages advance this long-running task."] },
          { from: "queue", to: "workers", title: ["标准化页面", "Normalize the page"],
            description: ["Python 读取原始文件、统一图片格式并保留页面产物；随后消费识别阶段消息。", "Python reads the source, normalizes the image format and retains page artifacts, then consumes the recognition stage."] },
          { from: "workers", to: "models", title: ["请求视觉识别", "Request visual recognition"],
            description: ["图片分支调用 Qwen-VL OCR，把页面图像转换为文字片段。", "The image branch calls Qwen-VL OCR to convert page images into text segments."] },
          { from: "models", to: "workers", title: ["接收识别片段", "Receive recognized segments"],
            description: ["识别结果回到 Python，仍需清洗与人工复核。", "Recognition results return to Python and still require cleaning and human review."] },
          { from: "workers", to: "storage", title: ["清洗并保存草稿", "Clean and save a draft"],
            description: ["Python 整理 paragraphs、标记低置信度与疑似乱码，将 cleaned.json 保存到 MinIO。", "Python prepares paragraphs, flags low confidence and suspected garbling, and saves cleaned.json in MinIO."] },
          { from: "workers", to: "queue", title: ["通知质量校验", "Queue quality validation"],
            description: ["Python 发布 quality.validate，将清洗产物交给 Java 复核入口。", "Python publishes quality.validate to hand the cleaned artifact to the Java review entry point."] },
          { from: "queue", to: "core", title: ["创建人工复核", "Create a human review"],
            description: ["Java 消费质量校验消息、读取清洗产物，进入 manual_review_required。", "Java consumes quality validation, reads the cleaned artifact and enters manual_review_required."] },
          { from: "core", to: "client", title: ["展示待确认文本", "Show text for approval"],
            description: ["界面展示图片和段落，用户可以修改、合并或删除；系统在此等待人确认。", "The interface shows the image and paragraphs for editing, merging or deletion. The system waits for human approval here."] },
          { from: "client", to: "core", title: ["人工确认通过", "Human approves the text"],
            description: ["演示在此假设用户已完成复核并确认；真实任务不会自动越过这一步。", "The walkthrough assumes the user has reviewed and approved the text. A real task does not automatically bypass this step."] },
          { from: "core", to: "storage", title: ["保存审核版本", "Save the reviewed version"],
            description: ["Java 写入 reviewed.json，最终段落决定后续 Chunk 的数量与内容。", "Java writes reviewed.json. Final paragraphs determine the number and content of subsequent chunks."] },
          { from: "core", to: "queue", title: ["启动标签处理", "Queue chunk tagging"],
            description: ["确认后，Java 才发布规则标签阶段消息。", "Only after approval does Java publish the rule-tagging stage message."] },
          { from: "queue", to: "workers", title: ["标签质量门与回正", "Tag quality gate and correction"],
            description: ["Python 读取确认版本；本例规则标签足够可靠，跳过可选 LLM，完成回正与 Embedding。", "Python reads the approved version. Here, rule tags are sufficient, so optional LLM tagging is skipped before correction and embedding."] },
          { from: "workers", to: "database", title: ["索引有效 Chunk", "Index valid chunks"],
            description: ["Python 写入 knowledge_vector 并标记任务完成；无有效内容的任务不会成功入库。", "Python writes knowledge_vector and marks the task finished. A task without valid content does not successfully index."] },
          { from: "client", to: "core", title: ["查看任务结果", "Check the task result"],
            description: ["用户查询 OCR 任务与知识结果；复核后的文本已经完成索引。", "The user requests the OCR task and knowledge results after the reviewed text has been indexed."] },
          { from: "core", to: "database", title: ["读取完成状态", "Read completion state"],
            description: ["Java 查询当前用户的任务状态与知识记录。", "Java reads the current user’s task state and knowledge records."] },
          { from: "database", to: "core", title: ["返回完成结果", "Return completion results"],
            description: ["存储层返回已完成的任务和有效知识条目。", "The store returns the finished task and valid knowledge entries."] },
          { from: "core", to: "client", title: ["图片成为知识", "The image becomes knowledge"],
            description: ["页面展示可检索知识与处理结果，一次图片到知识的交互完成。", "The interface shows searchable knowledge and processing results, completing the image-to-knowledge interaction."] },
        ],
      },
    ],
  },
  "urban-sidequest": {
    groups: [
      {
        id: "routing", label: ["在线路线编排", "Online route orchestration"],
        description: ["Spring Boot 持有在线请求的编排和验收权，模型建议及地图事实都经过这一边界。", "Spring Boot owns online orchestration and validation; model proposals and map facts pass through this boundary."],
        position: [0, 1.6, 0], size: [4.8, 4], nodes: ["core"],
      },
      {
        id: "data", label: ["空间数据与缓存", "Spatial data and cache"],
        description: ["PostGIS 和 Redis 为路线服务提供空间召回、用户画像和热点路段缓存。", "PostGIS and Redis support spatial recall, user profiles and hot-segment caching for the route service."],
        position: [0, -2.2, 1.15], size: [7.54, 3.4], nodes: ["database", "cache"],
      },
      {
        id: "offline", label: ["离线学习 · 演进", "Offline learning · evolution"],
        description: ["独立的 Judge、数据集和训练边界；线上质量重排接入保持设计标记，不与当前同步主链混同。", "A separate judging, dataset and training boundary; online quality reranking remains marked as planned, outside the current synchronous path."],
        position: [-5.75, 0, -3.91], size: [3.2, 3], nodes: ["training"],
      },
    ],
    nodes: [
      {
        id: "client", label: "Android / Compose", model: "mobile", position: [-6.9, 0.3, 3.45], scale: 0.7, emphasis: "support",
        description: ["Kotlin、Compose 与 Amap Android SDK 提供地图交互，以 ViewModel 和 StateFlow 管理路线状态。", "Kotlin, Compose and the Amap Android SDK provide map interactions, with ViewModel and StateFlow managing route state."],
        kind: ["移动客户端", "Mobile client"], tags: [["地图交互", "Map UI"], ["路线选择", "Route selection"]],
        documents: ["docs/overview/technical-design.md"],
      },
      {
        id: "core", label: "Spring Boot", model: "service", position: [0, 1.8, 0], scale: 1.7, emphasis: "primary",
        description: ["同步路线服务负责画像加载、POI 召回与评分、候选组合、真实路段校准、硬约束过滤和审计。", "The synchronous route service loads profiles, retrieves and scores POIs, composes candidates, calibrates segments, validates constraints and audits results."],
        kind: ["路线编排服务", "Route orchestration"], tags: [["POI 召回", "POI retrieval"], ["路线编排", "Route pipeline"], ["约束校验", "Validation"]],
        documents: ["docs/algorithm/推荐路径算法.md", "docs/algorithm/poi/POI线性打分矩阵取值设计.md", "docs/user/用户画像问卷与画像表设计.md"],
      },
      {
        id: "database", label: "PostGIS", model: "database", position: [-2.07, -2, 1.15], scale: 0.55, emphasis: "support",
        description: ["PostgreSQL/PostGIS 承载空间查询与用户资产；地图输入和路线全链路使用 GCJ-02 坐标。", "PostgreSQL/PostGIS stores spatial data and user assets; map inputs and route processing use GCJ-02 coordinates."],
        kind: ["空间与业务存储", "Spatial / business store"], tags: [["空间查询", "Spatial queries"], ["偏好画像", "Profiles"]],
        documents: ["docs/overview/technical-design.md", "docs/user/用户画像问卷与画像表设计.md"],
      },
      {
        id: "cache", label: "Redis", model: "cache", position: [2.07, -2, 1.15], scale: 0.55, emphasis: "support",
        description: ["缓存热点候选与地图路段，减少重复召回和第三方路线请求。", "Caches hot candidates and map segments to reduce repeated retrieval and third-party routing requests."],
        kind: ["热点缓存", "Hot-data cache"], tags: [["候选缓存", "Candidate cache"], ["路段缓存", "Segment cache"]], documents: [],
      },
      {
        id: "maps", label: "Amap Web API", model: "external", position: [5.75, 1, 2.875], scale: 0.85, emphasis: "secondary",
        description: ["提供真实路段距离和时间；服务端保留失败降级、硬约束和最终可执行性验收。", "Provides real segment distances and times, while the server retains fallback handling, hard constraints and final feasibility checks."],
        kind: ["地图依赖", "Map dependency"], tags: [["距离 / 时间", "Distance / time"], ["真实可达性", "Reachability"]],
        documents: ["docs/algorithm/推荐路径算法.md"],
      },
      {
        id: "models", label: "LLM Service", model: "external", position: [5.75, 1, -2.875], scale: 0.85, emphasis: "secondary",
        description: ["在线仅从受控 POI 池组合候选顺序，不生成地理事实；离线模拟 Judge 为冻结候选集提供评价。", "Online composition uses only bounded POI IDs, never invented geographic facts. Offline simulated judges evaluate frozen candidate sets."],
        kind: ["模型依赖", "Model dependency"], tags: [["候选组合", "Candidate composition"], ["模拟评价", "Simulated judging"]],
        documents: ["docs/algorithm/推荐路径算法.md", "docs/algorithm/route/LLM模拟用户路线选择设计.md"],
      },
      {
        id: "training", label: "Python / ML", model: "workers", position: [-5.75, 0.2, -3.91], scale: 0.85, emphasis: "secondary",
        description: ["离线 Judge、版本化数据集与路线偏好训练。线上独立质量重排、软拒绝属于演进设计，不代表当前同步主链已启用。", "Offline judging, versioned datasets and route-preference training. Independent online reranking and soft rejection are an evolution design, not an enabled step in the current synchronous pipeline."],
        kind: ["离线训练 / 演进设计", "Offline training / evolution"], tags: [["Judge / Dataset", "Judge / Dataset"], ["偏好训练", "Preference training"], ["质量设计", "Quality design"]],
        documents: ["ai-python/src/urban_sidequest_ai/route_preference_judge/README.md", "ai-python/src/urban_sidequest_ai/models/route_preference/README.md", "docs/algorithm/route/路线偏好排序模型训练设计.md", "docs/algorithm/route/路线X特征定义.md", "docs/algorithm/route/路线裁判与软拒绝设计.md"],
      },
    ],
    edges: [
      { from: "client", to: "core", label: ["同步路线请求", "Synchronous route request"] },
      { from: "core", to: "database", label: ["空间召回 / 画像", "Spatial recall / profiles"] },
      { from: "core", to: "cache", label: ["候选 / 路段缓存", "Candidate / segment cache"] },
      { from: "core", to: "models", label: ["受控 POI 候选组合", "Bounded POI composition"] },
      { from: "core", to: "maps", label: ["真实路段校准", "Real-segment calibration"] },
      { from: "core", to: "training", label: ["候选与特征归档", "Candidate and feature ingest"] },
      { from: "training", to: "models", label: ["模拟 Judge 评价", "Simulated judge evaluation"] },
      { from: "training", to: "core", label: ["质量重排 / 软拒绝（设计）", "Quality reranking / soft rejection (planned)"], planned: true },
    ],
    flows: [
      {
        id: "route-generation", label: ["路线生成", "Route generation"],
        steps: [
          { from: "client", to: "core", title: ["请求一条路线", "Request a route"],
            description: ["Android 提交起点、偏好与路线约束；Java 开始同步编排。", "Android submits the start point, preferences and route constraints. Java begins synchronous orchestration."] },
          { from: "core", to: "database", title: ["读取画像与 POI", "Read profiles and POIs"],
            description: ["Java 加载用户画像，并从空间数据中召回候选地点。", "Java loads the user profile and retrieves candidate places from spatial data."] },
          { from: "database", to: "core", title: ["返回候选地点", "Return candidate places"],
            description: ["空间记录返回路线服务，作为后续评分与组合的事实基础。", "Spatial records return to the route service as the factual basis for scoring and composition."] },
          { from: "core", to: "core", title: ["筛选受控候选池", "Select a bounded POI pool"],
            description: ["线性评分与多样性采样收窄候选池；必到点与用户约束参与筛选。", "Linear scores and diversity sampling narrow the POI pool, respecting must-visit places and user constraints."] },
          { from: "core", to: "models", title: ["组合路线草案", "Compose route drafts"],
            description: ["LLM 仅从候选池 ID 组合路线顺序，不生成坐标、距离或营业状态。", "The LLM arranges route drafts using only POI IDs in the bounded pool, without inventing coordinates, distances or opening status."] },
          { from: "models", to: "core", title: ["返回候选顺序", "Return proposed sequences"],
            description: ["路线草案回到 Java，地理事实和可执行性仍由服务端验收。", "Draft routes return to Java. The server still validates geographic facts and feasibility."] },
          { from: "core", to: "cache", title: ["检查路段缓存", "Check segment cache"],
            description: ["Java 先查询已有路段距离与时间；本例需要请求未缓存的路段。", "Java checks cached segment distances and times. This example needs uncached segments."] },
          { from: "core", to: "maps", title: ["校准真实路段", "Calibrate real segments"],
            description: ["调用高德获取相邻 POI 之间的真实距离与耗时。", "Amap supplies actual distances and travel times between adjacent POIs."] },
          { from: "maps", to: "core", title: ["返回地图事实", "Return map facts"],
            description: ["真实路段信息交回 Java；本例地图请求成功，失败时另有缓存与降级分支。", "Real segment data returns to Java. Map requests succeed here; failures have separate cache and fallback paths."] },
          { from: "core", to: "core", title: ["校验路线约束", "Validate route constraints"],
            description: ["服务端过滤路段数量、总时间等不合格路线；当前主链保留模型候选顺序。", "The server filters routes that violate segment-count, total-time or other constraints. The current pipeline retains model candidate order."] },
          { from: "core", to: "client", title: ["展示可执行路线", "Show executable routes"],
            description: ["Android 接收通过校验的路线，供用户在地图中选择。", "Android receives validated routes for the user to choose on the map."] },
        ],
        description: ["Android 发起请求，Java 从空间数据和画像筛选 POI，使用缓存与 LLM 组合候选，再调用高德校准并返回可执行路线。", "Android requests a route. Java selects POIs from spatial data and profiles, uses caches and LLM composition, then calibrates with Amap before returning executable routes."],
        nodes: ["client", "core", "database", "cache", "models", "maps"],
        documents: ["docs/overview/technical-design.md", "docs/algorithm/推荐路径算法.md", "docs/algorithm/poi/POI线性打分矩阵取值设计.md"],
      },
      {
        id: "preference-learning", label: ["偏好学习 · 演进设计", "Preference learning · evolution"],
        description: ["Python 请求候选路线，多模型 Judge 产生可审计监督，冻结数据集后训练排序与质量模型；接入线上独立重排和软拒绝仍标记为设计。", "Python requests candidates and multi-model judges produce auditable supervision. Frozen datasets train ranking and quality models; independent online reranking and soft rejection remain marked as planned."],
        nodes: ["training", "core", "models"],
        documents: ["ai-python/src/urban_sidequest_ai/route_preference_judge/README.md", "docs/algorithm/route/LLM模拟用户路线选择设计.md", "docs/algorithm/route/路线偏好排序模型训练设计.md", "docs/algorithm/route/路线裁判与软拒绝设计.md"],
      },
    ],
  },
  "scrapider-guidelines": {
    groups: [
      {
        id: "entry", label: ["规范入口与路由", "Guidance entry and routing"],
        description: ["SKILL.md 定义共通纪律，并把任务引向对应技术栈参考。", "SKILL.md defines shared discipline and routes tasks to relevant stack references."],
        position: [0, 1.6, 0], size: [3.8, 3.4], nodes: ["skill"],
      },
      {
        id: "references", label: ["按需参考包", "Routed reference packages"],
        description: ["Java、Python 与 Android 参考是由任务选择的规范文件，不是运行时服务。", "Java, Python and Android references are guidance files selected for a task, not runtime services."],
        position: [0, -1.8, 0], size: [11.935, 3.4], nodes: ["java", "python", "android"],
      },
      {
        id: "review-boundary", label: ["独立审查角色", "Independent review role"],
        description: ["只读审查角色使用共享规则和技术栈参考，形成可复核的工程发现。", "The read-only review role uses shared rules and stack references to produce verifiable engineering findings."],
        position: [6.6125, 0.6, 1.3225], size: [3.2, 3.2], nodes: ["review"],
      },
    ],
    nodes: [
      {
        id: "repository", label: "Skill Repository", model: "repository", position: [-6.6125, 0.5, 3.9675], scale: 0.7, emphasis: "support",
        description: ["可安装的工程规范包，包含执行入口、技术栈参考和独立审查角色；这些是文件与依赖关系，不是部署服务。", "An installable engineering-guidance package with an entry point, stack references and a review role; these are files and dependencies, not deployed services."],
        kind: ["规范仓库", "Guidance repository"], tags: [["可安装 Skill", "Installable Skill"], ["按需参考", "Routed references"]],
        documents: ["README_zh-CN.md"],
      },
      {
        id: "skill", label: "SKILL.md", model: "package", position: [0, 1.8, 0], scale: 1.7, emphasis: "primary",
        description: ["定义共通执行纪律，按目标仓库与任务技术栈选择所需参考，要求最小改动和可验证交付。", "Defines shared engineering discipline and selects references by repository and task stack, requiring minimal changes and verifiable delivery."],
        kind: ["执行入口与路由", "Entry point / router"], tags: [["范围识别", "Scope inspection"], ["参考路由", "Reference routing"], ["契约保护", "Contract preservation"]],
        documents: ["SKILL.md"],
      },
      {
        id: "java", label: "Java References", model: "package", position: [-3.9675, -1.6, 0], scale: 0.65, emphasis: "support",
        description: ["Spring Boot 分层所有权、数据模型边界与 Maven 多模块依赖方向。", "Spring Boot layer ownership, data-model boundaries and Maven multi-module dependency direction."],
        kind: ["技术栈参考包", "Stack reference package"], tags: [["Spring Boot", "Spring Boot"], ["Maven 边界", "Maven boundaries"]],
        documents: ["references/java/spring-boot-backend.md", "references/java/spring-boot-multi-module.md"],
      },
      {
        id: "python", label: "Python References", model: "package", position: [0, -1.6, 0], scale: 0.65, emphasis: "support",
        description: ["Python 领域逻辑、工作流、适配器、异步边界和资源生命周期规范。", "Guidance for Python domain logic, workflows, adapters, async boundaries and resource lifecycles."],
        kind: ["技术栈参考包", "Stack reference package"], tags: [["包与导入", "Packages / imports"], ["资源生命周期", "Resource lifecycle"]],
        documents: ["references/python/python-code-organization.md"],
      },
      {
        id: "android", label: "Android References", model: "package", position: [3.9675, -1.6, 0], scale: 0.65, emphasis: "support",
        description: ["Kotlin 与 Compose 的单向状态流、组合稳定性和 UI 副作用边界。", "Unidirectional state, composition stability and UI effect boundaries for Kotlin and Compose."],
        kind: ["技术栈参考包", "Stack reference package"], tags: [["Kotlin / Compose", "Kotlin / Compose"], ["状态与副作用", "State / effects"]],
        documents: ["references/android/android-kotlin-compose.md"],
      },
      {
        id: "review", label: "Review Agent", model: "package", position: [6.6125, 0.8, 1.3225], scale: 1.1, emphasis: "secondary",
        description: ["独立只读规范审查角色，选择相关规则并以源码证据报告结构、契约和正确性问题。", "An independent read-only review role that selects relevant rules and reports structural, contract and correctness issues using source evidence."],
        kind: ["审查角色与共享规则", "Review role / shared rules"], tags: [["只读审查", "Read-only review"], ["证据报告", "Evidence report"]],
        documents: ["agents/scrapider-standards-reviewer.md", "references/shared/standards-review.md"],
      },
    ],
    edges: [
      { from: "repository", to: "skill", label: ["包执行入口", "Package entry point"] },
      { from: "skill", to: "java", label: ["按任务加载", "Load for relevant tasks"] },
      { from: "skill", to: "python", label: ["按任务加载", "Load for relevant tasks"] },
      { from: "skill", to: "android", label: ["按任务加载", "Load for relevant tasks"] },
      { from: "repository", to: "review", label: ["独立审查角色", "Independent review role"] },
      { from: "review", to: "java", label: ["审查证据基线", "Review baseline"] },
      { from: "review", to: "python", label: ["审查证据基线", "Review baseline"] },
      { from: "review", to: "android", label: ["审查证据基线", "Review baseline"] },
    ],
    flows: [
      {
        id: "implementation", label: ["按技术栈实施", "Implement by stack"],
        description: ["从 Skill 入口识别仓库约束和任务范围，仅加载匹配技术栈的参考，再以最小改动保护既有契约。", "The Skill identifies repository rules and task scope, loads only matching stack references and preserves existing contracts through minimal changes."],
        nodes: ["repository", "skill", "java", "python", "android"],
        documents: ["SKILL.md"],
      },
      {
        id: "standards-review", label: ["独立规范审查", "Independent standards review"],
        description: ["审查角色按目标代码技术栈选择参考，沿真实边界查验行为，并输出可复核发现；不代表所有参考在每次审查都被加载。", "The review role selects references for the target stack, checks behavior across actual boundaries and reports verifiable findings; not every reference is loaded for every review."],
        nodes: ["repository", "review", "java", "python", "android"],
        documents: ["agents/scrapider-standards-reviewer.md", "references/shared/standards-review.md"],
      },
    ],
  },
};

export function getProjectArchitecture(
  project: ProjectRecord,
  locale: ArchiveLocale,
): ProjectArchitecture {
  const definition = architectures[project.slug];
  const languageIndex = locale === "zh" ? 0 : 1;
  const availablePaths = new Set(project.documents.map((document) => document.path));
  const existingDocuments = (paths: readonly string[]) => paths.filter((path) => availablePaths.has(path));

  if (!definition) {
    return {
      kind: "package",
      nodes: [{
        id: "repository", label: project.title, description: project.summary,
        kind: locale === "zh" ? "项目仓库" : "Project repository",
        model: "repository", scale: 1, emphasis: "primary", tags: [], position: [0, 0, 0], documents: [],
      }],
      edges: [], flows: [], groups: [],
    };
  }

  return {
    kind: project.slug === "scrapider-guidelines" ? "package" : "system",
    groups: definition.groups.map((group) => ({
      ...group,
      label: group.label[languageIndex],
      description: group.description[languageIndex],
    })),
    nodes: definition.nodes.map((node) => ({
      ...node,
      description: node.description[languageIndex],
      kind: node.kind[languageIndex],
      tags: node.tags.map((tag) => tag[languageIndex]),
      documents: existingDocuments(node.documents),
    })),
    edges: definition.edges.map((edge) => ({ ...edge, label: edge.label[languageIndex] })),
    flows: definition.flows.map((flow) => ({
      ...flow,
      label: flow.label[languageIndex],
      description: flow.description[languageIndex],
      steps: flow.steps?.map((step) => ({
        ...step,
        title: step.title[languageIndex],
        description: step.description[languageIndex],
      })),
      documents: existingDocuments(flow.documents),
    })),
  };
}
