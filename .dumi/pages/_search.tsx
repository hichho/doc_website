import React, {FC, Fragment,useCallback,useEffect,useState} from 'react';
import { useSiteSearch } from 'dumi';
import { title } from '../global';
import { Input, List } from 'antd';
import {ISearchResult} from "dumi/dist/client/theme-api/useSiteSearch";

type ISearchFlatData = (
  | {
  type: 'title';
  value: Pick<ISearchResult[0], 'title'>;
}
  | {
  type: 'hint';
  activeIndex: number;
  value: ISearchResult[0]['hints'][0];
}
  )[];

const { Search } = Input;

const Highlight: FC<{
  texts: ISearchResult[0]['hints'][0]['highlightTexts'];
}> = (props) => {
  return (
    <>
      {props.texts.map((text, idx) => (
        <Fragment key={idx}>
          {text.highlighted ? <mark>{text.text}</mark> : text.text}
        </Fragment>
      ))}
    </>
  );
};

const useFlatSearchData = (data: ISearchResult) => {
  const update = useCallback((): [ISearchFlatData, number] => {
    let activeIndex = 0;
    const ret: ISearchFlatData = [];

    data.forEach((item) => {
      if (item.title) {
        ret.push({
          type: 'title',
          value: {
            title: item.title,
          },
        });
      }
      item.hints.forEach((hint) => {
        ret.push({
          type: 'hint',
          activeIndex: activeIndex++,
          value: hint,
        });
      });
    });

    return [ret, activeIndex];
  }, [data]);
  const [flatData, setFlatData] = useState(update);

  useEffect(() => {
    setFlatData(update);
  }, [data]);

  return flatData;
};
const Home = () => {
  document.title = title;
  const { setKeywords, result } = useSiteSearch();


  console.log(result);
  const onSearch = (keywords) => {
    setKeywords(keywords);
  };

  return (
    <div>
      <Search placeholder="搜索" onSearch={onSearch} enterButton />
      <div>
        <List
          itemLayout="horizontal"
          dataSource={result}
          renderItem={(item, index) => (
            <List.Item>
              <List.Item.Meta
                // title={<Highlight texts={item}/>}
                description={item.hints[0].highlightTitleTexts[0].text}
              />
            </List.Item>
          )}
        />
      </div>
    </div>
  );
};
export default Home;
