import type { SupportedLocale } from "./locale.js";

export type TranslationKey =
  | "welcome"
  | "new_review_relearn"
  | "domains"
  | "instruction"
  | "quit_hint"
  | "offline_warning"
  | "offline_instruction"
  | "nothing_due"
  | "evaluating"
  | "translating"
  | "prompt_answer"
  | "session_ended"
  | "session_complete"
  | "cards_rated"
  | "avg_rating"
  | "forgot"
  | "feedback_title"
  | "answer_title"
  | "keep_waiting"
  | "local_ai_working"
  | "wait_warning"
  | "wait_info"
  | "keep_waiting_llm"
  | "proceeding_offline"
  | "eval_skipped";

export const TRANSLATIONS: Record<SupportedLocale, Record<TranslationKey, string>> = {
  en: {
    welcome: "Learning session: {count} card(s)",
    new_review_relearn: "  New: {newC}  Review: {reviewC}  Relearn: {relearnC}",
    domains: "  Domains: {domains}",
    instruction: "\nRecall each answer first, reveal it, then rate yourself honestly.",
    quit_hint: "Type 'q' at the answer prompt (or press Ctrl+C) to stop anytime.",
    offline_warning: "\n\x1b[33m⚠ LLM-Feedback & automatic translation are disabled.\x1b[0m",
    offline_instruction: "  Enable with: \x1b[36mnpm run dev -- settings llm on\x1b[0m\n",
    nothing_due: "Nothing due to learn. You're all caught up!",
    evaluating: "Evaluating answer via local AI...",
    translating: "Translating question dynamically...",
    prompt_answer: "Your answer (Enter to reveal · 'q' to stop):",
    session_ended: "Learning session ended.",
    session_complete: "Learning session complete!",
    cards_rated: "  Cards rated: {count}",
    avg_rating: "  Average rating: {avg}",
    forgot: "  Forgot: {count} card(s)",
    feedback_title: "── ZAM Feedback {line}",
    answer_title: "── Answer {line}",
    keep_waiting: "Would you like to keep waiting?",
    local_ai_working: "The local AI is still generating the response.",
    wait_warning: "⚠ The LLM server is taking a while to load the model.",
    wait_info: "(This is expected when transitioning between models or starting up from cold.)",
    keep_waiting_llm: "Would you like to keep waiting for the model?",
    proceeding_offline: "⚠ Proceeding in offline-mode (without active LLM evaluations for this session).",
    eval_skipped: "  [LLM Evaluation skipped: {reason}]",
  },
  de: {
    welcome: "Lern-Session: {count} Karte(n)",
    new_review_relearn: "  Neu: {newC}  Wiederholen: {reviewC}  Lernen: {relearnC}",
    domains: "  Domänen: {domains}",
    instruction: "\nRufe jede Antwort zuerst ab, decke sie auf und bewerte dich dann ehrlich selbst.",
    quit_hint: "Gib 'q' bei der Antwortaufforderung ein (oder drücke Strg+C), um jederzeit zu beenden.",
    offline_warning: "\n\x1b[33m⚠ LLM-Feedback & automatische Übersetzung sind deaktiviert.\x1b[0m",
    offline_instruction: "  Aktivieren mit: \x1b[36mnpm run dev -- settings llm on\x1b[0m\n",
    nothing_due: "Nichts fällig zu lernen. Du bist komplett auf dem Laufenden!",
    evaluating: "Bewerte Antwort via lokaler KI...",
    translating: "Übersetze Frage dynamisch...",
    prompt_answer: "Deine Antwort (Eingabe zum Aufdecken · 'q' zum Beenden):",
    session_ended: "Lern-Session beendet.",
    session_complete: "Lern-Session abgeschlossen!",
    cards_rated: "  Bewertete Karten: {count}",
    avg_rating: "  Durchschnittliche Bewertung: {avg}",
    forgot: "  Vergessen: {count} Karte(n)",
    feedback_title: "── ZAM Feedback {line}",
    answer_title: "── Antwort {line}",
    keep_waiting: "Möchtest du weiter auf die Bewertung warten?",
    local_ai_working: "Die lokale KI arbeitet noch an der Antwort.",
    wait_warning: "⚠ Der LLM-Server braucht ungewöhnlich lange, um das Modell zu laden.",
    wait_info: "(Das ist normal, wenn das Modell gewechselt wird oder kalt startet.)",
    keep_waiting_llm: "Möchtest du weiter auf das Modell warten?",
    proceeding_offline: "⚠ Fahre im Offline-Modus fort (ohne aktive LLM-Bewertungen in dieser Runde).",
    eval_skipped: "  [LLM-Bewertung übersprungen: {reason}]",
  },
  es: {
    welcome: "Sesión de aprendizaje: {count} tarjeta(s)",
    new_review_relearn: "  Nuevas: {newC}  Repasar: {reviewC}  Reaprender: {relearnC}",
    domains: "  Dominios: {domains}",
    instruction: "\nRecuerda cada respuesta primero, revélala y califícate honestamente.",
    quit_hint: "Escribe 'q' en la respuesta (o presiona Ctrl+C) para salir en cualquier momento.",
    offline_warning: "\n\x1b[33m⚠ Los comentarios de LLM y la traducción automática están desactivados.\x1b[0m",
    offline_instruction: "  Activar con: \x1b[36mnpm run dev -- settings llm on\x1b[0m\n",
    nothing_due: "No hay nada pendiente para aprender. ¡Estás al día!",
    evaluating: "Evaluando respuesta con IA local...",
    translating: "Traduciendo pregunta dinámicamente...",
    prompt_answer: "Tu respuesta (Intro para revelar · 'q' para salir):",
    session_ended: "Sesión de aprendizaje finalizada.",
    session_complete: "¡Sesión de aprendizaje completada!",
    cards_rated: "  Tarjetas calificadas: {count}",
    avg_rating: "  Calificación promedio: {avg}",
    forgot: "  Olvidadas: {count} tarjeta(s)",
    feedback_title: "── Comentarios de ZAM {line}",
    answer_title: "── Respuesta {line}",
    keep_waiting: "¿Deseas seguir esperando la evaluación?",
    local_ai_working: "La IA local todavía está generando la respuesta.",
    wait_warning: "⚠ El servidor LLM está tardando en cargar el modelo.",
    wait_info: "(Esto es normal al cambiar de modelo o iniciar en frío.)",
    keep_waiting_llm: "¿Deseas seguir esperando el modelo?",
    proceeding_offline: "⚠ Continuando en modo fuera de línea (sin evaluaciones de LLM en esta sesión).",
    eval_skipped: "  [Evaluación de LLM omitida: {reason}]",
  },
  fr: {
    welcome: "Session d'apprentissage : {count} carte(s)",
    new_review_relearn: "  Nouveau: {newC}  Révision: {reviewC}  Relever: {relearnC}",
    domains: "  Domaines: {domains}",
    instruction: "\nRappelez-vous chaque réponse d'abord, révélez-la, puis évaluez-vous honnêtement.",
    quit_hint: "Tapez 'q' (ou Ctrl+C) pour quitter à tout moment.",
    offline_warning: "\n\x1b[33m⚠ Les commentaires LLM et la traduction automatique sont désactivés.\x1b[0m",
    offline_instruction: "  Activer avec : \x1b[36mnpm run dev -- settings llm on\x1b[0m\n",
    nothing_due: "Rien à apprendre. Vous êtes à jour !",
    evaluating: "Évaluation de la réponse via l'IA locale...",
    translating: "Traduction dynamique de la question...",
    prompt_answer: "Votre réponse (Entrée pour révéler · 'q' pour quitter) :",
    session_ended: "Session d'apprentissage arrêtée.",
    session_complete: "Session d'apprentissage terminée !",
    cards_rated: "  Cartes évaluées: {count}",
    avg_rating: "  Note moyenne: {avg}",
    forgot: "  Oubliées: {count} carte(s)",
    feedback_title: "── Commentaires ZAM {line}",
    answer_title: "── Réponse {line}",
    keep_waiting: "Voulez-vous continuer à attendre l'évaluation ?",
    local_ai_working: "L'IA locale est toujours en train de générer la réponse.",
    wait_warning: "⚠ Le serveur LLM prend du temps pour charger le modèle.",
    wait_info: "(Ceci est normal lors de la transition entre modèles ou du démarrage à froid.)",
    keep_waiting_llm: "Voulez-vous continuer à attendre le modèle ?",
    proceeding_offline: "⚠ Poursuite en mode hors ligne (sans évaluation active de l'IA pour cette session).",
    eval_skipped: "  [Évaluation LLM ignorée : {reason}]",
  },
  pt: {
    welcome: "Sessão de aprendizado: {count} cartão(ões)",
    new_review_relearn: "  Novos: {newC}  Revisar: {reviewC}  Reaprender: {relearnC}",
    domains: "  Domínios: {domains}",
    instruction: "\nLembre-se de cada resposta primeiro, revele-a e avalie-se honestamente.",
    quit_hint: "Digite 'q' (ou Ctrl+C) para parar a qualquer momento.",
    offline_warning: "\n\x1b[33m⚠ O feedback do LLM e a tradução automática estão desativados.\x1b[0m",
    offline_instruction: "  Ativar com: \x1b[36mnpm run dev -- settings llm on\x1b[0m\n",
    nothing_due: "Nada faturado para aprender. Você está atualizado!",
    evaluating: "Avaliando a resposta via IA local...",
    translating: "Traduzindo pergunta dinamicamente...",
    prompt_answer: "Sua resposta (Enter para revelar · 'q' para parar):",
    session_ended: "Sessão de aprendizado encerrada.",
    session_complete: "Sessão de aprendizado concluída!",
    cards_rated: "  Cartões avaliados: {count}",
    avg_rating: "  Nota média: {avg}",
    forgot: "  Esquecidos: {count} cartão(ões)",
    feedback_title: "── Feedback ZAM {line}",
    answer_title: "── Resposta {line}",
    keep_waiting: "Deseja continuar esperando pela avaliação?",
    local_ai_working: "A IA local ainda está gerando a resposta.",
    wait_warning: "⚠ O servidor LLM está demorando para carregar o modelo.",
    wait_info: "(Isso é esperado ao alternar modelos ou iniciar do zero.)",
    keep_waiting_llm: "Deseja continuar esperando o modelo?",
    proceeding_offline: "⚠ Continuando no modo offline (sem avaliações de LLM ativas nesta sessão).",
    eval_skipped: "  [Avaliação LLM omitida: {reason}]",
  },
  zh: {
    welcome: "学习课: {count} 张卡片",
    new_review_relearn: "  新卡: {newC}  复习: {reviewC}  重学: {relearnC}",
    domains: "  知识领域: {domains}",
    instruction: "\n首先在脑中回忆答案，然后揭晓并诚实自我评分。",
    quit_hint: "在回答提示处输入 'q' (或按 Ctrl+C) 可随时退出。",
    offline_warning: "\n\x1b[33m⚠ LLM 反馈与自动翻译已禁用。\x1b[0m",
    offline_instruction: "  开启命令: \x1b[36mnpm run dev -- settings llm on\x1b[0m\n",
    nothing_due: "目前没有需要学习的内容。您已全部掌握！",
    evaluating: "正在通过本地 AI 评估回答...",
    translating: "正在动态翻译问题...",
    prompt_answer: "您的回答 (按回车揭晓 · 输入 'q' 退出):",
    session_ended: "学习课已结束。",
    session_complete: "学习课已完成！",
    cards_rated: "  已评分卡片: {count}",
    avg_rating: "  平均分: {avg}",
    forgot: "  遗忘: {count} 张卡片",
    feedback_title: "── ZAM 反馈 {line}",
    answer_title: "── 参考答案 {line}",
    keep_waiting: "是否继续等待评分？",
    local_ai_working: "本地 AI 仍在生成回答。",
    wait_warning: "⚠ LLM 服务器正在加载模型，这可能需要一些时间。",
    wait_info: "(这在切换模型或冷启动时是正常现象。)",
    keep_waiting_llm: "是否继续等待模型加载？",
    proceeding_offline: "⚠ 正在以离线模式继续（本次学习课将不包含活跃的 AI 评估）。",
    eval_skipped: "  [已跳过 LLM 评估: {reason}]",
  },
  ja: {
    welcome: "学習セッション: {count} 枚のカード",
    new_review_relearn: "  新規: {newC}  復習: {reviewC}  再学習: {relearnC}",
    domains: "  ドメイン: {domains}",
    instruction: "\n最初に回答を思い出し、次に回答を表示して、正直に自己評価してください。",
    quit_hint: "回答プロンプトで「q」を入力する（または Ctrl+C を押す）と、いつでも終了できます。",
    offline_warning: "\n\x1b[33m⚠ LLM フィードバックと自動翻訳は無効です。\x1b[0m",
    offline_instruction: "  有効化するには: \x1b[36mnpm run dev -- settings llm on\x1b[0m\n",
    nothing_due: "学習予定のカードはありません。すべて完了しています！",
    evaluating: "ローカルAIによる回答の評価中...",
    translating: "質問を動的に翻訳中...",
    prompt_answer: "あなたの回答 (Enterで表示 · 'q'で終了):",
    session_ended: "学習セッションが終了しました。",
    session_complete: "学習セッションが完了しました！",
    cards_rated: "  評価済みカード数: {count}",
    avg_rating: "  平均評価: {avg}",
    forgot: "  忘れたカード数: {count} 枚",
    feedback_title: "── ZAM フィードバック {line}",
    answer_title: "── 解答 {line}",
    keep_waiting: "評価の生成を待ちますか？",
    local_ai_working: "ローカルAIが回答を生成しています。",
    wait_warning: "⚠ LLM サーバーがモデルをロードするのに時間がかかっています。",
    wait_info: "(モデルの移行中やコールドスタート時には、これが予想されます。)",
    keep_waiting_llm: "モデルのロードを待ち続けますか？",
    proceeding_offline: "⚠ オフラインモードで続行します（このセッションではアクティブな AI 評価は行われません）。",
    eval_skipped: "  [LLM 評価がスキップされました: {reason}]",
  },
};

/**
 * Format and interpolate a translation string with key-value params.
 */
export function t(
  locale: SupportedLocale,
  key: TranslationKey,
  params: Record<string, string | number> = {}
): string {
  const dict = TRANSLATIONS[locale] || TRANSLATIONS.en;
  let str = dict[key] || TRANSLATIONS.en[key] || "";

  for (const [k, v] of Object.entries(params)) {
    str = str.replace(new RegExp(`{${k}}`, "g"), String(v));
  }

  return str;
}
