import { NextResponse } from 'next/server';
import axios from 'axios';

const GITLAB_URL = process.env.GITLAB_URL || 'https://gitlab.com';
const GITLAB_TOKEN = process.env.GITLAB_TOKEN || '';

interface GitLabConfig {
  url: string;
  token: string;
  projectId: string;
}

function getConfig(): GitLabConfig {
  return {
    url: process.env.GITLAB_URL || 'https://gitlab.com',
    token: process.env.GITLAB_TOKEN || '',
    projectId: process.env.GITLAB_DEFAULT_PROJECT || ''
  };
}

export async function GET(request: Request) {
  try {
    const config = getConfig();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id') || config.projectId;

    if (!config.token) {
      return NextResponse.json({ error: 'GitLab token not configured' }, { status: 400 });
    }

    const response = await axios.get(
      `${config.url}/api/v4/projects/${encodeURIComponent(projectId)}`,
      {
        headers: { 'PRIVATE-TOKEN': config.token },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('GitLab API error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to fetch project', details: error.response?.data },
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const config = getConfig();
    const body = await request.json();
    const { action, project_id, ...params } = body;

    if (!config.token) {
      return NextResponse.json({ error: 'GitLab token not configured' }, { status: 400 });
    }

    const projectId = project_id || config.projectId;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    let result: any;

    switch (action) {
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
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('GitLab API error:', error.response?.data || error.message);
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
      title: params.title || 'Shadow Clone Auto MR',
      description: params.description || 'Created by Shadow Clone',
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
  params: {
    branch?: string;
    ref?: string;
  }
) {
  const branchName = params.branch || `shadow-${Date.now()}`;
  const response = await axios.post(
    `${config.url}/api/v4/projects/${encodeURIComponent(projectId)}/repository/branches`,
    {
      branch: branchName,
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
    commit_message?: string;
    actions?: Array<{
      action: 'create' | 'update' | 'delete';
      file_path: string;
      content?: string;
    }>;
  }
) {
  const response = await axios.post(
    `${config.url}/api/v4/projects/${encodeURIComponent(projectId)}/repository/commits`,
    {
      branch: params.branch || 'main',
      commit_message: params.commit_message || 'Shadow Clone commit',
      actions: params.actions || [],
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
    branch?: string;
    file_path?: string;
    content?: string;
    commit_message?: string;
  }
) {
  const response = await axios.post(
    `${config.url}/api/v4/projects/${encodeURIComponent(projectId)}/repository/files/${encodeURIComponent(params.file_path || 'README.md')}`,
    {
      branch: params.branch || 'main',
      content: params.content || '',
      commit_message: params.commit_message || 'Add file from Shadow Clone',
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
  return { branches: response.data };
}
