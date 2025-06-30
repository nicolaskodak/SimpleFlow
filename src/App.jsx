import React, { useState, useCallback, useRef, useEffect } from 'react';

// --- API Call Function ---
const callGeminiAPI = async (prompt, input, apiKey) => {
    // 附加指令，要求 API 回應為特定格式的 JSON
    const fullPrompt = `
指令: ${prompt}

輸入內容:
---
${input}
---

重要規則：請務必將您的回應格式化為 JSON 物件。此物件必須包含一個名為 "text" 的鍵，其值為您的主要回覆內容。
範例：{"text": "這是您的回覆內容..."}
`;

    // 如果沒有提供 API 金鑰，則返回模擬回應
    if (!apiKey) {
        console.warn("未提供 API 金鑰。將使用模擬回應。");
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        console.log("正在使用模擬提示呼叫 Gemini:", fullPrompt);
        const mockResponse = {
            text: `這是一個對於指令「${prompt}」的模擬回應。請在設定頁面中輸入您的 Gemini API Key 以啟用真實呼叫。`
        };
        return JSON.stringify(mockResponse, null, 2); // 回傳格式化的 JSON 字串
    }

    // 使用真實的 Gemini API 端點
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const payload = {
        contents: [{
            role: "user",
            parts: [{ text: fullPrompt }]
        }]
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API 請求失敗: ${response.status} ${response.statusText} - ${errorData.error?.message || '未知錯誤'}`);
        }

        const result = await response.json();
        if (result.candidates && result.candidates.length > 0) {
            const rawText = result.candidates[0].content.parts[0].text;
            // 嘗試解析 API 回傳的文字，確保其為有效的 JSON
            try {
                // 清理可能存在於 JSON 前後的 markdown 標記
                const cleanJsonString = rawText.replace(/^```json\s*|```$/g, '').trim();
                JSON.parse(cleanJsonString);
                return cleanJsonString; // 如果是有效的 JSON，直接回傳
            } catch (e) {
                // 如果不是有效的 JSON，將其包裝成我們需要的格式
                console.warn("API 未回傳有效的 JSON，正在進行格式修正。");
                const fixedResponse = { text: rawText };
                return JSON.stringify(fixedResponse, null, 2);
            }
        } else {
            throw new Error("API 成功響應，但未返回有效的候選內容。");
        }
    } catch (error) {
        console.error("Gemini API 呼叫失敗:", error);
        throw error;
    }
};


// --- Helper Functions ---
const generateId = () => `card_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;


// --- React Components ---

const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
    if (!message) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm mx-4">
                <p className="text-lg mb-6 text-gray-800">{message}</p>
                <div className="flex justify-end gap-4">
                    <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition-colors">取消</button>
                    <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold transition-colors">確認刪除</button>
                </div>
            </div>
        </div>
    );
};

const Settings = ({ apiKey, setApiKey, setView }) => {
    const [localApiKey, setLocalApiKey] = useState(apiKey);

    const handleSave = () => {
        setApiKey(localApiKey);
        setView('workflow');
    };

    return (
        <div className="p-4 sm:p-8 max-w-2xl mx-auto bg-gray-100 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-3xl font-bold text-gray-800">設定</h2>
                 <button onClick={() => setView('workflow')} className="text-gray-500 hover:text-gray-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">Gemini API Key</label>
                <input
                    type="password"
                    id="apiKey"
                    value={localApiKey}
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="請輸入您的 API Key"
                />
                <p className="mt-2 text-xs text-gray-500">您的 API 金鑰將被儲存在瀏覽器中，不會被傳送到我們的伺服器。</p>
            </div>
            <div className="mt-6 flex justify-end">
                <button onClick={handleSave} className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 transition duration-300">
                    儲存
                </button>
            </div>
        </div>
    );
};

const SvgConnectors = ({ cards, cardRefs }) => {
    const [lines, setLines] = useState([]);

    useEffect(() => {
        const calculateLines = () => {
            const newLines = [];
            
            Object.values(cards).forEach(card => {
                const parentEl = cardRefs.current[card.id];
                if (card.children.length > 0 && parentEl) {
                    // 起點：父卡片的右側中心
                    const x1 = parentEl.offsetLeft + parentEl.offsetWidth;
                    const y1 = parentEl.offsetTop + parentEl.offsetHeight / 2;

                    card.children.forEach(childId => {
                        const childEl = cardRefs.current[childId];
                        if (childEl) {
                            // 終點：子卡片的左側中心
                            const x2 = childEl.offsetLeft;
                            const y2 = childEl.offsetTop + childEl.offsetHeight / 2;
                            
                            newLines.push({
                                id: `${card.id}-${childId}`,
                                x1, y1, x2, y2
                            });
                        }
                    });
                }
            });
            setLines(newLines);
        };
        
        const timeoutId = setTimeout(calculateLines, 50);
        const observer = new ResizeObserver(calculateLines);
        const mainContainer = document.getElementById('workflow-container');
        if (mainContainer) observer.observe(mainContainer);

        return () => {
            clearTimeout(timeoutId);
            if (mainContainer) observer.unobserve(mainContainer);
        };
    }, [cards, cardRefs]);

    return (
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" />
                </marker>
            </defs>
            {lines.map(line => (
                <path
                    key={line.id}
                    d={`M ${line.x1} ${line.y1} C ${line.x1 + 80} ${line.y1}, ${line.x2 - 80} ${line.y2}, ${line.x2} ${line.y2}`}
                    stroke="#9ca3af"
                    strokeWidth="2"
                    fill="none"
                    markerEnd="url(#arrow)"
                />
            ))}
        </svg>
    );
};

const Card = React.memo(({ card, updateCard, addChild, setCardRef, isDragging, onDelete, style, onMouseDown }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const getSnippet = (jsonString) => {
        if (!jsonString) return "";
        try {
            const parsed = JSON.parse(jsonString);
            const text = parsed.text || JSON.stringify(parsed);
            return text.length > 50 ? text.substring(0, 50) + '...' : text;
        } catch (e) {
            return jsonString.length > 50 ? jsonString.substring(0, 50) + '...' : jsonString;
        }
    };

    const cardStatusColor = () => {
        if (card.status === 'processing') return 'border-blue-500';
        if (card.status === 'done') return 'border-green-500';
        if (card.status === 'error') return 'border-red-500';
        return 'border-gray-300';
    };

    const combinedStyle = {
        ...style,
        width: 320,
        cursor: isDragging ? 'grabbing' : 'grab',
    };

    return (
        <div
            ref={el => setCardRef(card.id, el)}
            onMouseDown={onMouseDown}
            style={combinedStyle}
            className={`bg-white shadow-xl rounded-lg border-2 transition-all duration-300 z-10 ${cardStatusColor()}`}
        >
            <button
                onClick={() => onDelete(card.id)}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors z-20 p-1 rounded-full hover:bg-red-100"
                title="刪除卡片"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="p-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">指令 (Prompt)</label>
                <textarea
                    value={card.prompt}
                    onChange={(e) => updateCard(card.id, { prompt: e.target.value })}
                    placeholder="請輸入給 Gemini 的指令"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    rows="3"
                />
            </div>
            {card.status && (
                <div className="px-4 pb-2">
                    <h3 className="text-sm font-medium text-gray-700 mb-1">執行結果 (JSON)</h3>
                    <div className="bg-gray-50 p-3 rounded-md min-h-[60px] max-h-48 overflow-y-auto">
                        {card.status === 'processing' && <div className="text-blue-600 animate-pulse">處理中...</div>}
                        {card.status === 'error' && <div className="text-red-600 text-sm">{card.result}</div>}
                        {card.status === 'done' && (
                            <div>
                                <pre className="text-gray-800 text-xs whitespace-pre-wrap break-words">
                                    {isExpanded ? card.result : getSnippet(card.result)}
                                </pre>
                                <button onClick={() => setIsExpanded(!isExpanded)} className="text-indigo-600 hover:text-indigo-800 text-xs mt-2">
                                    {isExpanded ? '收合' : '展開'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <div className="flex justify-center items-center p-2 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                <button
                    onClick={() => addChild(card.id)}
                    className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-110"
                    title="新增子節點"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                </button>
            </div>
        </div>
    );
});

export default function App() {
    const [cards, setCards] = useState({});
    const [view, setView] = useState('workflow');
    const [apiKey, setApiKey] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);
    const [modalInfo, setModalInfo] = useState({ message: '', cardId: null });
    
    const cardRefs = useRef({});
    const containerRef = useRef(null);

    // --- Dragging Logic ---
    const [draggingCard, setDraggingCard] = useState(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    const handleMouseDown = useCallback((e, cardId) => {
        if (e.target.closest('textarea, button, a')) return;
        setDraggingCard(cardId);
        setOffset({ x: e.clientX - e.currentTarget.offsetLeft, y: e.clientY - e.currentTarget.offsetTop });
        e.preventDefault();
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (!draggingCard) return;
        const x = e.clientX - offset.x;
        const y = e.clientY - offset.y;
        setCards(prev => ({ ...prev, [draggingCard]: { ...prev[draggingCard], position: { x, y } } }));
    }, [draggingCard, offset]);

    const handleMouseUp = useCallback(() => setDraggingCard(null), []);

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('mousemove', handleMouseMove);
            container.addEventListener('mouseup', handleMouseUp);
            container.addEventListener('mouseleave', handleMouseUp);
        }
        return () => {
            if (container) {
                container.removeEventListener('mousemove', handleMouseMove);
                container.removeEventListener('mouseup', handleMouseUp);
                container.removeEventListener('mouseleave', handleMouseUp);
            }
        };
    }, [handleMouseMove, handleMouseUp]);

    // --- Card Management ---
    const setCardRef = (id, el) => { cardRefs.current[id] = el; };

    const addCard = useCallback((parentId = null) => {
        const newCardId = generateId();
        let position = { x: 50, y: 50 };
        const cardWidth = 320, horizontalGap = 100, verticalGap = 40, cardHeight = 250;

        if (parentId) {
            const parentCard = cards[parentId];
            const siblings = Object.values(cards).filter(c => c.parent === parentId);
            position = { 
                x: parentCard.position.x + cardWidth + horizontalGap, 
                y: parentCard.position.y + (siblings.length * (cardHeight + verticalGap))
            };
        } else {
             const rootCards = Object.values(cards).filter(c => !c.parent);
             if (rootCards.length > 0) {
                 const lastRoot = rootCards.sort((a,b) => a.position.y - b.position.y)[rootCards.length - 1];
                 position = {x: lastRoot.position.x, y: lastRoot.position.y + cardHeight + verticalGap};
             }
        }

        const newCard = { id: newCardId, prompt: '', result: null, status: null, position, children: [], parent: parentId };
        setCards(prev => {
            const newCards = { ...prev, [newCardId]: newCard };
            if (parentId) {
                newCards[parentId] = { ...newCards[parentId], children: [...newCards[parentId].children, newCardId] };
            }
            return newCards;
        });
    }, [cards]);

    const updateCard = useCallback((id, updates) => {
        setCards(prev => ({ ...prev, [id]: { ...prev[id], ...updates } }));
    }, []);

    const handleDeleteRequest = (cardId) => {
        setModalInfo({ message: '您確定要刪除這張卡片及其所有後續卡片嗎？此操作無法復原。', cardId });
    };

    const cancelDelete = () => setModalInfo({ message: '', cardId: null });

    const confirmDelete = () => {
        if (!modalInfo.cardId) return;
        setCards(prevCards => {
            const cardIdToDelete = modalInfo.cardId;
            let cardsToDelete = new Set([cardIdToDelete]);
            let queue = [...(prevCards[cardIdToDelete]?.children || [])];
            while (queue.length > 0) {
                const currentId = queue.shift();
                if (prevCards[currentId]) {
                    cardsToDelete.add(currentId);
                    queue.push(...(prevCards[currentId].children || []));
                }
            }
            const newCards = { ...prevCards };
            cardsToDelete.forEach(id => {
                delete newCards[id];
                delete cardRefs.current[id];
            });
            const parentId = prevCards[cardIdToDelete]?.parent;
            if (parentId && newCards[parentId]) {
                newCards[parentId] = { ...newCards[parentId], children: newCards[parentId].children.filter(childId => childId !== cardIdToDelete) };
            }
            return newCards;
        });
        cancelDelete();
    };

    // --- Execution Logic ---
    const executeWorkflow = async () => {
        if (!apiKey) {
            alert("請先在設定頁面中輸入您的 Gemini API Key。");
            setView('settings');
            return;
        }
        setIsExecuting(true);
        const cardsAtExecutionStart = { ...cards };
        
        setCards(prev => {
            const resetCards = {};
            for (const id in prev) resetCards[id] = {...prev[id], status: null, result: null};
            return resetCards;
        });
        await new Promise(resolve => setTimeout(resolve, 100));

        const rootNodes = Object.values(cardsAtExecutionStart).filter(card => !card.parent);

        const executeNode = async (cardId, input) => {
            try {
                updateCard(cardId, { status: 'processing' });
                const cardToExecute = cardsAtExecutionStart[cardId];
                if (!cardToExecute) throw new Error("找不到卡片");
                
                const jsonResultString = await callGeminiAPI(cardToExecute.prompt, input, apiKey);
                updateCard(cardId, { status: 'done', result: jsonResultString });
                
                let nextInput = "";
                try {
                    const parsedResult = JSON.parse(jsonResultString);
                    nextInput = parsedResult.text || "";
                } catch (e) {
                    console.error("解析 JSON 結果失敗:", e);
                    nextInput = jsonResultString;
                }

                if (cardToExecute.children.length > 0) {
                    await Promise.all(cardToExecute.children.map(childId => executeNode(childId, nextInput)));
                }
            } catch (error) {
                console.error("執行錯誤:", error);
                updateCard(cardId, { status: 'error', result: `執行失敗: ${error.message}` });
            }
        };
        await Promise.all(rootNodes.map(node => executeNode(node.id, "這是工作流程的初始輸入。")));
        setIsExecuting(false);
    };
    
    // --- Render ---
    if (view === 'settings') {
        return <Settings apiKey={apiKey} setApiKey={setApiKey} setView={setView} />;
    }

    return (
        <div className="bg-gray-100 min-h-screen font-sans flex flex-col">
            <ConfirmationModal message={modalInfo.message} onConfirm={confirmDelete} onCancel={cancelDelete} />
            <header className="p-4 bg-white shadow-md flex justify-between items-center z-20">
                <div className="text-center flex-grow">
                    <h1 className="text-2xl font-bold text-gray-800">工作流程建構器</h1>
                    <p className="text-sm text-gray-500">使用 Gemini API 建立、連結並執行您的自動化流程</p>
                </div>
                <button onClick={() => setView('settings')} className="text-gray-600 hover:text-indigo-600 p-2 rounded-full hover:bg-gray-200" title="設定">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
            </header>

            <main 
                id="workflow-container"
                ref={containerRef}
                className="relative w-full flex-grow overflow-auto"
            >
                <SvgConnectors cards={cards} cardRefs={cardRefs} />
                
                {Object.keys(cards).length === 0 && !isExecuting && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                        <p className="text-gray-500 mb-4">您的畫布是空的。從一張卡片開始吧！</p>
                        <button onClick={() => addCard()} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-300">新增起始卡片</button>
                    </div>
                )}

                {Object.values(cards).map(card => (
                     <Card
                        key={card.id}
                        card={card}
                        updateCard={updateCard}
                        addChild={addCard}
                        setCardRef={setCardRef}
                        isDragging={draggingCard === card.id}
                        onDelete={handleDeleteRequest}
                        onMouseDown={(e) => handleMouseDown(e, card.id)}
                        style={{
                            position: 'absolute',
                            left: card.position.x,
                            top: card.position.y,
                        }}
                    />
                ))}
            </main>

            <footer className="p-4 bg-white/80 backdrop-blur-sm border-t border-gray-200 flex justify-center items-center z-20">
                <button
                    onClick={executeWorkflow}
                    disabled={isExecuting || Object.keys(cards).length === 0}
                    className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-green-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isExecuting ? (<><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>執行中...</>) : ("執行工作流程")}
                </button>
            </footer>
        </div>
    );
}
