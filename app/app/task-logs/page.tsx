"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { 
  ClipboardDocumentListIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { useBackendTaskHistories } from "@/hooks/useBackendAccount";

export default function TaskLogsPage() {
  const sessionResponse = useSession();
  const session = sessionResponse?.data;
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // 使用SWR hooks获取任务历史记录
  const { taskHistories, pagination, isLoading, error, refetch } = useBackendTaskHistories(currentPage, pageSize);

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取状态图标和颜色
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'finished':
        return {
          icon: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
          text: 'Finished',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700'
        };
      case 'failed':
        return {
          icon: <XCircleIcon className="w-5 h-5 text-red-500" />,
          text: 'Failed',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700'
        };
      case 'processing':
        return {
          icon: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />,
          text: 'Processing',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700'
        };
      default:
        return {
          icon: <ClockIcon className="w-5 h-5 text-gray-500" />,
          text: status,
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700'
        };
    }
  };

  // 获取任务类型显示文本
  const getActionDisplayName = (action: string) => {
    switch (action) {
      case 'diffusion':
        return 'Text to Image';
      case 'upscale':
        return 'Upscale';
      default:
        return action;
    }
  };

  // 处理分页
  const handlePageChange = (newPage: number) => {
    const totalPages = Math.ceil(pagination.total / pagination.size);
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // 从pagination中获取分页数据
  const totalPages = Math.ceil(pagination.total / pagination.size);
  const totalRecords = pagination.total;

  if (!session) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to view your task logs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Task Logs</h1>
        <p className="text-gray-600">View your task execution logs and history</p>
      </div>

      {/* Task Logs Content */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Recent Tasks</h2>
            {!isLoading && totalRecords > 0 && (
              <span className="text-sm text-gray-500">
                Total: {totalRecords} tasks
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p>Loading task histories...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            <XCircleIcon className="w-12 h-12 mx-auto mb-4 text-red-300" />
            <p className="font-medium">Error loading task histories</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : taskHistories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <ClipboardDocumentListIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No task logs found</p>
            <p className="text-sm mt-1">Your task execution logs will appear here</p>
          </div>
        ) : (
          <>
            {/* Task List */}
            <div className="divide-y divide-gray-200">
              {taskHistories.map((task: any) => {
                const statusInfo = getStatusInfo(task.status);
                return (
                  <div key={task.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                            {statusInfo.icon}
                            {statusInfo.text}
                          </span>
                          <span className="text-sm font-medium text-gray-700">
                            {getActionDisplayName(task.action)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {task.task_model?.toUpperCase() || 'N/A'}
                          </span>
                        </div>

                        <div className="mb-2">
                          <p className="text-sm text-gray-600 font-mono">
                            Task ID: {task.task_id}
                          </p>
                          {task.detail?.taskInput?.prompt && (
                            <p className="text-sm text-gray-800 mt-1">
                              <strong>Prompt:</strong> {task.detail.taskInput.prompt}
                            </p>
                          )}
                          {task.detail?.taskInput?.originTaskId && (
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>Origin Task:</strong> {task.detail.taskInput.originTaskId}
                              {task.detail.taskInput.index && (
                                <span className="ml-2">Index: {task.detail.taskInput.index}</span>
                              )}
                            </p>
                          )}
                          {task.detail?.errorMessage && (
                            <p className="text-sm text-red-600 mt-1">
                              <strong>Error:</strong> {task.detail.errorMessage}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            {formatDate(task.created_at)}
                          </span>
                          {task.usage > 0 && (
                            <span>
                              Credits: {task.usage}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Page {pagination.page} of {totalPages} ({totalRecords} total)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 rounded-md text-sm ${
                            pageNum === pagination.page
                              ? 'bg-purple-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === totalPages}
                    className="p-2 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}