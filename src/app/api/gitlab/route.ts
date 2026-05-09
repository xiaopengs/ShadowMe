import { NextResponse } from 'next/server';
import axios from 'axios';
import { logger } from '@/lib/logger';

const apiLogger = logger.child({ module: 'api/gitlab' });

interface GitLabConfig {
  url: string;
  token: string;
  projectId: string;
}

function getConfig(): GitLabConfig {
  return {
    url: process.env.GITLAB_URL || 'https://gitlab.com',
    token: process.env.GITLAB_TOKEN || '',
    projectId: process.env.GITLAB_PROJECT_ID || ''
  };
}

export async function GET(request: Request) {
  try {
    const config = getConfig();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id') || config.projectId;

    if (!config.token) {
      apiLogger.warn('GitLab token not configured', { operation: 'GET' });
      return NextResponse.json({ error: 'GitLab token not configured' }, { status: 400 });
    }

    const response = await axios.get(
      `${config.url}/api/v4/projects/${encodeURIComponent(projectId)}`,
      {
        headers: { 'PRIVATE-TOKEN': config.token },
      }
    );

    apiLogger.info('GitLab project fetched', { projectId });
    return NextResponse.json(response.data);
  } catch (error: any) {
    apiLogger.error('GitLab API error', error, { 
      operation: 'GET',
      details: error.response?.data || error.message 
    });
    return NextResponse.json(
      { error: 'Failed to fetch project', details: error.response?.data },
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(request: Request) {
  let actionValue: string | undefined;
  
  try {
    const config = getConfig();
    const body = await request.json();
    const { action, project_id, ...params } = body;
    actionValue = action as string;

    if (!config.token) {
      apiLogger.warn('GitLab token not configured', { operation: 'POST' });
      return NextResponse.json({ error: 'GitLab token not configured' }, { status: 400 });
    }

    const projectId = project_id || config.projectId;

    if (!projectId) {
      apiLogger.warn('Project ID required', { operation: 'POST' });
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    let result: any;

    switch (actionValue) {
      case 'create_mr':
        result = await createMergeRequest(config, projectId, params);
        break;
      case 'create_branch':
        result = await createBranch(config, projectId, params);
        break;
      case 'commit_file':
        result = await commitFile(config, projectId, params);
        break;
      case 'create_file':
        result = await createFile(config, projectId, params);
        break;
      case 'get_branches':
        result = await getBranches(config, projectId);
        break;
      default:
        apiLogger.warn('Invalid GitLab action', { action: actionValue, operation: 'POST' });
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    apiLogger.info('GitLab action completed', { action: actionValue, projectId });
    return NextResponse.json(result);
  } catch (error: any) {
    apiLogger.error('GitLab API error', error, { 
      operation: 'POST',
      action: actionValue,
      details: error.response?.data || error.message 
    });
    return NextResponse.json(
      { error: 'GitLab API error', details: error.response?.data || error.message },
      { status: error.response?.status || 500 }
    );
  }
}

async function createMergeRequest(
  config: GitLabConfig,
  projectId: string,
  params: {
    source_branch?: string;
    target_branch?: string;
    title?: string;
    description?: string;
  }
) {
  const response = await axios.post(
    `${config.url}/api/v4/projects/${encodeURIComponent(projectId)}/merge_requests`,
    {
      source_branch: params.source_branch || `shadow-${Date.now()}`,
      target_branch: params.target_branch || 'main',
      title: params.title || 'ShadowMe Auto MR',
      description: params.description || 'Created by ShadowMe',
    },
    {
      headers: { 'PRIVATE-TOKEN': config.token },
    }
  );
  return response.data;
}

async function createBranch(
  config: GitLabConfig,
  projectId: string,
  params: { branch?: string; ref?: string }
) {
  const response = await axios.post(
    `${config.url}/api/v4/projects/${encodeURIComponent(projectId)}/repository/branches`,
    {
      branch: params.branch || `shadow-${Date.now()}`,
      ref: params.ref || 'main',
    },
    {
      headers: { 'PRIVATE-TOKEN': config.token },
    }
  );
  return response.data;
}

async function commitFile(
  config: GitLabConfig,
  projectId: string,
  params: {
    branch?: string;
    file_path?: string;
    content?: string;
    commit_message?: string;
  }
) {
  const response = await axios.post(
    `${config.url}/api/v4/projects/${encodeURIComponent(projectId)}/repository/files/${encodeURIComponent(params.file_path || 'shadow.txt')}`,
    {
      branch: params.branch || 'main',
      content: params.content || 'Created by ShadowMe',
      commit_message: params.commit_message || 'ShadowMe commit',
    },
    {
      headers: { 'PRIVATE-TOKEN': config.token },
    }
  );
  return response.data;
}

async function createFile(
  config: GitLabConfig,
  projectId: string,
  params: {
    file_path?: string;
    content?: string;
    branch?: string;
  }
) {
  const filePath = params.file_path || `shadow-${Date.now()}.txt`;
  const response = await axios.post(
    `${config.url}/api/v4/projects/${encodeURIComponent(projectId)}/repository/files/${encodeURIComponent(filePath)}`,
    {
      branch: params.branch || 'main',
      content: params.content || 'Created by ShadowMe',
      commit_message: 'Add file via ShadowMe',
    },
    {
      headers: { 'PRIVATE-TOKEN': config.token },
    }
  );
  return response.data;
}

async function getBranches(config: GitLabConfig, projectId: string) {
  const response = await axios.get(
    `${config.url}/api/v4/projects/${encodeURIComponent(projectId)}/repository/branches`,
    {
      headers: { 'PRIVATE-TOKEN': config.token },
    }
  );
  return response.data;
}
