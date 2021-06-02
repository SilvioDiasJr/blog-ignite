import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client'
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

import { getPrismicClient } from '../../services/prismic';
import Header from '../../components/Header';
import Comments from '../../components/Comments';
import { ButtomClosePreview } from '../../components/ButtomClosePreview';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  uid: string;
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
  preview: boolean;
  previousPost: Post | null;
  nextPost: Post | null;
}

export default function Post({ post, preview, previousPost, nextPost }: PostProps) {
  const router = useRouter()

  const readingTime = post.data.content.reduce((count, content) => {
    const headingWords = content.heading.split('')
    const bodyWords = RichText.asText(content.body).split('')

    count += headingWords.length
    count += bodyWords.length

    return Math.ceil(count / 200)
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
          {post.last_publication_date && (
            <span>
              * editado em
              {format(new Date(post.last_publication_date),
                " dd MMM yyyy', às 'HH:mm", { locale: ptBR })}
            </span>
          )}


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

        <div className={styles.pagination}>
          <div>
            {previousPost && (
              <Link href={`/post/${previousPost.uid}`}>
                <a>
                  <p>{previousPost.data.title}</p>
                  <span>Post anterior</span>
                </a>
              </Link>
            )}
          </div>

          <div>
            {nextPost && (
              <Link href={`/post/${nextPost.uid}`}>
                <a>
                  <p>{nextPost.data.title}</p>
                  <span >Próximo post</span>
                </a>
              </Link>
            )}
          </div>
        </div>
        <Comments />

        {preview && (
          <ButtomClosePreview />
        )}
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

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData
}) => {
  const prismic = getPrismicClient();
  const { slug } = params
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null
  })

  const previousPost = (
    await prismic.query(Prismic.predicates.at('document.type', 'posts'), {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date desc]',
      fetch: ['post.title'],
    })
  ).results[0];

  const nextPost = (
    await prismic.query(Prismic.predicates.at('document.type', 'posts'), {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
      fetch: ['post.title'],
    })
  ).results[0];
  
  const posts = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
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
      preview,
      previousPost: previousPost ?? null,
      nextPost: nextPost ?? null
    },
    revalidate: 60 * 60 * 24, // 24 horas
  }
};
