import { ReactNode } from 'react';
import { theme } from 'antd';

interface PageContainerProps {
  title?: string;
  subTitle?: string;
  extra?: ReactNode;
  children: ReactNode;
}

export default function PageContainer({ title, subTitle, extra, children }: PageContainerProps) {
  const { token } = theme.useToken();

  return (
    <div style={{ padding: 16 }}>
      {title && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 16,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: token.colorText }}>
              {title}
            </h2>
            {subTitle && (
              <p style={{ margin: '4px 0 0', color: token.colorTextSecondary, fontSize: 14 }}>
                {subTitle}
              </p>
            )}
          </div>
          {extra && <div>{extra}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
