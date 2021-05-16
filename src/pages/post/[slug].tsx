import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client'
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter()

  const readingTime = post.data.content.reduce((count, content) => {
    const headingWords = content.heading.split('')
    const bodyWords = RichText.asText(content.body).split('')

    count += headingWords.length
    count += bodyWords.length

    return 4
  }, 0)

  if (router.isFallback)
    return <div>Carregando...</div>

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling.</title>
      </Head>

      <Header />

      <div className={styles.banner}>
        <img src={post.data.banner.url} alt='banner' />
      </div>
      <main className={commonStyles.containerContent}>
        <div className={styles.content}>
          <h1>{post.data.title}</h1>

          <div className={styles.info}>
            <span>
              <FiCalendar />
              {format(new Date(post.first_publication_date),
                'dd MMM yyyy',
                { locale: ptBR }
              )}
            </span>
            <span>
              <FiUser />
              {post.data.author}
            </span>
            <span>
              <FiClock />
              {`${readingTime} min`}
            </span>
          </div>

          <article className={styles.containerContent}>
            {post.data.content.map(post => (
              <section
                className={styles.contentPost}
                key={post.heading}
              >
                <h1>{post.heading}</h1>
                <div
                  dangerouslySetInnerHTML={{ __html: RichText.asHtml(post.body) }}
                />
              </section>
            )
            )}
          </article>
        </div>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ]);

  const params = posts.results.map(post => ({
    params: {
      slug: post.uid
    }
  }))

  return {
    paths: params,
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(context.params.slug), {})

  const posts = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content
    }
  }

  return {
    props: {
      post: posts,
    }
  }
};
