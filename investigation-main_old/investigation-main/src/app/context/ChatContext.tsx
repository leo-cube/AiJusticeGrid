'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ChatMessage, AgentType, ChatContextType } from '@/app/types';
import augmentAIService from '@/services/augmentAI';
import defaultSettings from '@/config/defaultSettings.json';

interface ChatContextProviderType {
  messages: ChatMessage[];
  isTyping: boolean;
  isChatOpen: boolean;
  currentAgent: AgentType;
  selectedAgents: AgentType[];
  agentContexts: Record<AgentType, ChatContextType>;
  currentContext?: ChatContextType;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  toggleChat: () => void;
  setCurrentAgent: (agentType: AgentType, context?: ChatContextType) => void;
  selectAgent: (agentType: AgentType, context?: ChatContextType) => void;
  deselectAgent: (agentType: AgentType) => void;
  resetMurderAgentSession: () => Promise<boolean>;
}

const ChatContext = createContext<ChatContextProviderType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<AgentType>('general');
  const [selectedAgents, setSelectedAgents] = useState<AgentType[]>(['general']);
  const [agentContexts, setAgentContexts] = useState<Record<AgentType, ChatContextType>>({
    'general': { agentType: 'general', agentName: 'General Assistant' }
  });
  const [currentContext, setCurrentContext] = useState<ChatContextType | undefined>();
  // Track which agents have responded to the current user message
  const [respondedAgents, setRespondedAgents] = useState<Set<AgentType>>(new Set());

  // Get typing delay from environment or default settings
  const typingDelay = Number(process.env.NEXT_PUBLIC_TYPING_DELAY) ||
    defaultSettings.ui.chat.typingDelay;

  // Load messages and session ID from localStorage on initial render
  useEffect(() => {
    // Load messages
    const storedMessages = localStorage.getItem('chatMessages');
    if (storedMessages) {
      try {
        setMessages(JSON.parse(storedMessages));
      } catch (error) {
        console.error('Failed to parse stored messages:', error);
        localStorage.removeItem('chatMessages');
      }
    }

    // Load Murder Agent session ID if available
    try {
      const storedSessionId = localStorage.getItem('murderAgentSessionId');
      if (storedSessionId) {
        console.log('Found stored Murder Agent session ID:', storedSessionId);

        // Update the Murder Agent context with the session ID
        setAgentContexts(prev => {
          if (prev['murder']) {
            return {
              ...prev,
              'murder': {
                ...prev['murder'],
                sessionId: storedSessionId,
                usingLiveBackend: true
              }
            };
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Failed to load stored session ID:', error);
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Reset the responded agents set for this new user message
    setRespondedAgents(new Set());

    // Create user message for the current agent
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content,
      timestamp: new Date().toISOString(),
      status: 'sent',
      agentType: currentAgent,
      context: currentContext,
    };

    // For Murder Agent, special handling for different steps
    if (currentAgent === 'murder') {
      // If this is the first user message and we're at the greeting step
      if (currentContext?.currentStep === 'greeting' && messages.length === 1) {
        console.log('First message to Murder Agent, treating as case ID');
        // This is likely the case ID response
        userMessage.content = content.trim();
      }

      // If we're at the analysis_pending step and the user sends "continue" or "analyze"
      if (currentContext?.currentStep === 'analysis_pending' &&
          (content.toLowerCase().includes('continue') ||
           content.toLowerCase().includes('analyze'))) {
        console.log('User requested to continue analysis, setting special flag');
        // Mark this as a special analysis continuation request
        userMessage.content = 'CONTINUE_ANALYSIS';
      }
    }

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Mark the current agent as about to respond to prevent duplicates
      setRespondedAgents(prev => new Set([...prev, currentAgent]));

      // Check if this is a murder agent that should use the backend
      let response;
      let usingBackend = false;
      let updatedContext = { ...currentContext };

      if (currentAgent === 'murder') {
        try {
          // Try to get response from the Murder Agent backend
          console.log('Attempting to use Murder Agent backend');

          // Get the session ID from the current context if available
          let sessionId = currentContext?.sessionId;

          // Try to get the session ID from localStorage if not in context
          if (!sessionId) {
            try {
              const storedSessionId = localStorage.getItem('murderAgentSessionId');
              if (storedSessionId) {
                sessionId = storedSessionId;
                console.log('Retrieved session ID from localStorage:', sessionId);
              }
            } catch (e) {
              console.error('Failed to retrieve session ID from localStorage:', e);
            }
          }

          console.log('Current session ID:', sessionId);

          // Log the full context for debugging
          console.log('Full context being sent:', JSON.stringify(currentContext));

          // If this is the first message and we don't have a session ID, we need to initialize the conversation
          if (!sessionId && !content.trim()) {
            console.log('No session ID and empty content, initializing Murder Agent conversation');

            // Make a special call to initialize the conversation
            const initResponse = await fetch('/api/murder-agent/direct', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                question: '',
                context: currentContext
              }),
            });

            if (initResponse.ok) {
              const initData = await initResponse.json();
              console.log('Murder Agent initialization response:', initData);

              if (initData.response) {
                response = initData.response;
                usingBackend = true;

                // Add a marker to the response to indicate it's from the live backend
                response = `**[LIVE DATA ANALYSIS]**\n\n${response}`;

                // Create a new context with the session information
                const newContext = { ...currentContext };

                if (initData.sessionId) {
                  newContext.sessionId = initData.sessionId;
                  newContext.isCollectingInfo = true;
                  newContext.currentStep = 'greeting';
                  newContext.collectedData = {};
                  newContext.usingLiveBackend = true;

                  // Update the context
                  updatedContext = newContext;

                  // Update the agent contexts
                  setAgentContexts(prev => ({
                    ...prev,
                    [currentAgent]: newContext
                  }));

                  console.log('Murder Agent initialized with session ID:', initData.sessionId);
                }
              }
            }
          } else {
            // Normal message processing
            console.log('Sending message to Murder Agent with session ID:', sessionId);

            // Create a copy of the context with the session ID
            const contextWithSessionId = {
              ...currentContext,
              sessionId: sessionId
            };

            const backendResponse = await fetch('/api/murder-agent/direct', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                question: content,
                context: contextWithSessionId,
                sessionId: sessionId
              }),
            });

            if (backendResponse.ok) {
              const data = await backendResponse.json();
              console.log('Murder Agent response data:', data);

              if (data.response) {
                response = data.response;
                usingBackend = true;
                console.log('Successfully used Murder Agent backend');

                // Add a marker to the response to indicate it's from the live backend
                response = `**[LIVE DATA ANALYSIS]**\n\n${response}`;

                // Create a new context object to avoid reference issues
                const newContext = { ...currentContext };

                // Update the context with session information
                if (data.sessionId) {
                  newContext.sessionId = data.sessionId;
                  console.log('Updated session ID:', data.sessionId);

                  // Store the session ID in localStorage for persistence
                  try {
                    localStorage.setItem('murderAgentSessionId', data.sessionId);
                    console.log('Saved session ID to localStorage:', data.sessionId);
                  } catch (e) {
                    console.error('Failed to save session ID to localStorage:', e);
                  }
                } else {
                  console.warn('No session ID in response, using existing session ID if available');
                  // Keep the existing session ID if available
                  if (sessionId) {
                    newContext.sessionId = sessionId;
                  }
                }

                // Update the context with conversation state information
                if (data.isCollectingInfo !== undefined) {
                  newContext.isCollectingInfo = data.isCollectingInfo;
                }

                if (data.currentStep) {
                  newContext.currentStep = data.currentStep;
                }

                if (data.collectedData) {
                  newContext.collectedData = data.collectedData;
                }

                // Set the updated context
                updatedContext = newContext;

                // Update the agent contexts to ensure persistence
                setAgentContexts(prev => ({
                  ...prev,
                  [currentAgent]: newContext
                }));

                console.log('Updated context:', updatedContext);
              } else {
                throw new Error('No response from Murder Agent backend');
              }
            } else {
              throw new Error(`Murder Agent backend error: ${backendResponse.statusText}`);
            }
          }
        } catch (backendError) {
          console.error('Error using Murder Agent backend:', backendError);
          console.log('Falling back to default response generation');
          // Fall back to the default response generation
          response = await augmentAIService.getResponse(content, currentAgent, currentContext);
        }
      } else {
        // For non-murder agents, use the default response generation
        response = await augmentAIService.getResponse(content, currentAgent, currentContext);
      }

      // Update context with live backend flag
      if (currentAgent === 'murder') {
        updatedContext.usingLiveBackend = usingBackend;
      }

      // Add a delay to simulate typing
      setTimeout(() => {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          content: response,
          timestamp: new Date().toISOString(),
          status: 'delivered',
          agentType: currentAgent,
          context: updatedContext,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setIsTyping(false);
      }, typingDelay);

      // If we have multiple agents selected (other than the current one),
      // get responses from them as well with a staggered delay
      const otherAgents = selectedAgents.filter(agent => agent !== currentAgent);

      if (otherAgents.length > 0) {
        // Process other agents one by one to prevent race conditions
        for (let i = 0; i < otherAgents.length; i++) {
          const agentType = otherAgents[i];

          // Skip if this agent has already responded (prevents duplicates)
          if (respondedAgents.has(agentType)) {
            continue;
          }

          // Mark this agent as responded
          setRespondedAgents(prev => new Set([...prev, agentType]));

          const agentContext = agentContexts[agentType];

          try {
            // Get response from this agent
            const agentResponse = await augmentAIService.getResponse(
              content,
              agentType,
              agentContext
            );

            // Create updated context with live backend flag for Murder agents
            const updatedAgentContext = { ...agentContext };
            if (agentType === 'murder' ||
                agentType === 'murder-chief' ||
                agentType === 'murder-cop-2' ||
                agentType === 'murder-case-3') {
              updatedAgentContext.usingLiveBackend = true;
            }

            // Add a staggered delay for each agent
            setTimeout(() => {
              const agentMessage: ChatMessage = {
                id: (Date.now() + i + 2).toString(),
                sender: 'assistant',
                content: agentResponse,
                timestamp: new Date().toISOString(),
                status: 'delivered',
                agentType: agentType,
                context: updatedAgentContext,
              };

              setMessages((prev) => [...prev, agentMessage]);
            }, typingDelay + (i + 1) * 1000); // Stagger responses by 1 second each
          } catch (error) {
            console.error(`Error getting response from agent ${agentType}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error getting AI response:', error);

      // Handle error gracefully
      setTimeout(() => {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          content: "I'm sorry, I encountered an error processing your request. Please try again later.",
          timestamp: new Date().toISOString(),
          status: 'delivered',
          agentType: currentAgent,
          context: currentContext,
        };

        setMessages((prev) => [...prev, errorMessage]);
        setIsTyping(false);
      }, typingDelay);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    localStorage.removeItem('chatMessages');
  };

  const toggleChat = () => {
    setIsChatOpen((prev) => !prev);
  };

  // Reset the Murder Agent session
  const resetMurderAgentSession = async () => {
    console.log('Completely resetting Murder Agent session');

    // Clear any stored session ID
    try {
      localStorage.removeItem('murderAgentSessionId');
      console.log('Cleared stored Murder Agent session ID');
    } catch (e) {
      console.error('Failed to clear stored Murder Agent session ID:', e);
    }

    // Clear messages first
    clearMessages();

    // Create a fresh context without any previous data
    const freshContext = {
      usingLiveBackend: true,
      isCollectingInfo: true,
      currentStep: 'greeting',
      collectedData: {}
    };

    // Update the current context with the fresh context
    setCurrentContext(freshContext);

    // Update the agent contexts
    setAgentContexts(prev => ({
      ...prev,
      ['murder']: freshContext
    }));

    // Add the initial greeting message
    const greetingMessage = {
      id: Date.now().toString(),
      sender: 'assistant',
      content: `**[LIVE DATA ANALYSIS]**\n\nHello, I'm the Murder Agent, an AI assistant specialized in homicide investigations. I'll help you analyze a murder case by collecting relevant information. Let's start with the basics. What is the Case ID for this investigation?`,
      timestamp: new Date().toISOString(),
      status: 'delivered',
      agentType: 'murder',
      context: freshContext,
    };

    setMessages([greetingMessage]);

    // Make a direct call to initialize a new session
    try {
      console.log('Initializing new Murder Agent session');

      const response = await fetch('/api/murder-agent/direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: 'FORCE_NEW_SESSION',
          context: freshContext,
          forceReset: true
        }),
      });

        if (response.ok) {
          const data = await response.json();
          console.log('Murder Agent session reset response:', data);

          // If we got a session ID, update the context
          if (data.sessionId) {
            // Update the fresh context with the new session ID
            const updatedContext = {
              ...freshContext,
              sessionId: data.sessionId
            };

            // Update the current context
            setCurrentContext(updatedContext);

            // Also update the agent contexts
            setAgentContexts(prev => ({
              ...prev,
              ['murder']: updatedContext
            }));

            // Store the session ID in localStorage
            try {
              localStorage.setItem('murderAgentSessionId', data.sessionId);
              console.log('Saved new session ID to localStorage:', data.sessionId);
            } catch (e) {
              console.error('Failed to save session ID to localStorage:', e);
            }

            console.log('Updated to new session ID:', data.sessionId);
          }

          console.log('Murder Agent reset complete');
          return true;
        } else {
          console.error('Failed to reset Murder Agent session:', await response.text());
          // Even if the API call fails, we've already reset the UI state
          return true;
        }
      } catch (error) {
        console.error('Error resetting Murder Agent session:', error);
        // Even if there's an error, we've already reset the UI state
        return true;
      }

    // We've already reset everything, so return true
    return true;
  };

  // Update the current agent and context
  const handleSetCurrentAgent = (agentType: AgentType, context?: ChatContextType) => {
    // Only update if the agent is actually changing
    if (currentAgent !== agentType) {
      setCurrentAgent(agentType);
    }

    // Only update context if it's provided and different from current
    if (context) {
      // Use a simple reference check first to avoid unnecessary stringification
      if (context !== currentContext) {
        // Only do deep comparison if needed
        let needsUpdate = true;

        // If we have a current context, do a more careful comparison
        if (currentContext) {
          try {
            // Compare only the essential properties to avoid unnecessary updates
            const essentialProps = ['usingLiveBackend', 'caseId', 'caseName', 'sessionId'];
            needsUpdate = essentialProps.some(prop =>
              context[prop] !== currentContext[prop]
            );
          } catch (e) {
            // If comparison fails, update to be safe
            console.error('Error comparing contexts:', e);
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          console.log('Updating context:', { old: currentContext, new: context });
          setCurrentContext(context);

          // For Murder Agent, if we're switching to the Murder Agent and there are no messages, add the greeting message
          if (agentType === 'murder' && messages.length === 0) {
            console.log('Adding initial greeting for Murder Agent');

            // Create a greeting message
            const greetingMessage: ChatMessage = {
              id: Date.now().toString(),
              sender: 'assistant',
              content: `**[LIVE DATA ANALYSIS]**\n\nHello, I'm the Murder Agent, an AI assistant specialized in homicide investigations. I'll help you analyze a murder case by collecting relevant information. Let's start with the basics. What is the Case ID for this investigation?`,
              timestamp: new Date().toISOString(),
              status: 'delivered',
              agentType: 'murder',
              context: {
                ...context,
                isCollectingInfo: true,
                currentStep: 'greeting'
              },
            };

            // Add the greeting message
            setMessages([greetingMessage]);

            // Also initialize the conversation with the Murder Agent backend
            try {
              console.log('Initializing Murder Agent conversation with session ID:', context.sessionId);

              fetch('/api/murder-agent/direct', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  question: 'FORCE_NEW_SESSION',
                  context: context,
                  sessionId: context.sessionId,
                  forceReset: true
                }),
              }).then(response => {
                if (response.ok) {
                  return response.json();
                }
                console.error('Failed to initialize Murder Agent conversation:', response.statusText);
                // Don't throw an error, just log it and continue
                return { success: false, error: 'Failed to initialize Murder Agent conversation' };
              }).then(data => {
                console.log('Murder Agent initialization response:', data);
                // If we got a session ID, store it
                if (data.sessionId) {
                  try {
                    localStorage.setItem('murderAgentSessionId', data.sessionId);
                    console.log('Saved session ID to localStorage:', data.sessionId);
                  } catch (e) {
                    console.error('Failed to save session ID to localStorage:', e);
                  }
                }
              }).catch(error => {
                console.error('Error initializing Murder Agent conversation:', error);
              });
            } catch (error) {
              console.error('Error initializing Murder Agent conversation:', error);
            }
          }
        }
      }
    }

    // If the agent isn't already selected, select it
    if (!selectedAgents.includes(agentType)) {
      selectAgent(agentType, context);
    }
  };

  // Add an agent to the selected agents list
  const selectAgent = (agentType: AgentType, context?: ChatContextType) => {
    // Add to selected agents if not already there
    if (!selectedAgents.includes(agentType)) {
      setSelectedAgents(prev => [...prev, agentType]);
    }

    // Update agent context only if it's provided and different
    if (context) {
      const currentAgentContext = agentContexts[agentType];

      // Only update if the context is different (using reference check first)
      if (!currentAgentContext || currentAgentContext !== context) {
        // For existing contexts, only update if essential properties changed
        let needsUpdate = !currentAgentContext;

        if (currentAgentContext) {
          try {
            // Compare only the essential properties
            const essentialProps = ['usingLiveBackend', 'caseId', 'caseName'];
            needsUpdate = essentialProps.some(prop =>
              context[prop] !== currentAgentContext[prop]
            );
          } catch (e) {
            console.error('Error comparing agent contexts:', e);
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          setAgentContexts(prev => ({
            ...prev,
            [agentType]: context
          }));
        }
      }
    }
  };

  // Remove an agent from the selected agents list
  const deselectAgent = (agentType: AgentType) => {
    // Don't allow deselecting the last agent
    if (selectedAgents.length <= 1 && selectedAgents[0] === agentType) {
      return;
    }

    setSelectedAgents(prev => prev.filter(agent => agent !== agentType));

    // If current agent is deselected, switch to another agent
    if (currentAgent === agentType) {
      const newCurrentAgent = selectedAgents.find(agent => agent !== agentType) || 'general';
      setCurrentAgent(newCurrentAgent);
      setCurrentContext(agentContexts[newCurrentAgent]);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        isTyping,
        isChatOpen,
        currentAgent,
        selectedAgents,
        agentContexts,
        currentContext,
        sendMessage,
        clearMessages,
        toggleChat,
        setCurrentAgent: handleSetCurrentAgent,
        selectAgent,
        deselectAgent,
        resetMurderAgentSession,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
