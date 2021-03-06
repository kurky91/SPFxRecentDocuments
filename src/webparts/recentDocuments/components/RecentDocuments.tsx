import * as React from "react";
import styles from "./RecentDocuments.module.scss";
import { IRecentDocumentsProps } from "./IRecentDocumentsProps";
import { escape } from "@microsoft/sp-lodash-subset";
import { autobind } from "office-ui-fabric-react/lib/Utilities";

import {
  DetailsList,
  DetailsListLayoutMode,
  Selection,
  SelectionMode,
  IColumn
} from "office-ui-fabric-react/lib/DetailsList";
import {
  SPHttpClient,
  SPHttpClientConfiguration,
  SPHttpClientResponse
} from "@microsoft/sp-http";

let _items: IDocument[] = [];

const fileIcons: { name: string }[] = [
  { name: "accdb" },
  { name: "csv" },
  { name: "docx" },
  { name: "dotx" },
  { name: "mpp" },
  { name: "mpt" },
  { name: "odp" },
  { name: "ods" },
  { name: "odt" },
  { name: "one" },
  { name: "onepkg" },
  { name: "onetoc" },
  { name: "potx" },
  { name: "ppsx" },
  { name: "pptx" },
  { name: "pub" },
  { name: "vsdx" },
  { name: "vssx" },
  { name: "vstx" },
  { name: "xls" },
  { name: "xlsx" },
  { name: "xltx" },
  { name: "xsn" }
];

export interface IRecentDocumentsState {
  columns: IColumn[];
  items: IDocument[];
  selectionDetails: string;
  isModalSelection: boolean;
  isCompactMode: boolean;
}

export interface IDocument {
  [key: string]: any;
  name: string;
  value: string;
  iconName: string;
  dateModified: string;
  dateModifiedValue: number;
  fileSize: string;
  fileSizeRaw: number;
  link: string;
}

export default class RecentDocuments extends React.Component<
  IRecentDocumentsProps,
  IRecentDocumentsState
> {
  private _selection: Selection;

  constructor(props: any, state: IRecentDocumentsState) {
    super(props);

    let url: string =
      "https://cloudfighters.sharepoint.com/sites/RecentDocuments/_api/search/query?querytext='*'";
    this.props.context.spHttpClient
      .get(url, SPHttpClient.configurations.v1)
      .then((response: SPHttpClientResponse) => {
        response.json();
      });
    //  Populate with items for demos.
    if (_items.length === 0) {
      for (let i = 0; i < 10; i++) {
        const randomDate = this._randomDate(new Date(2012, 0, 1), new Date());
        const randomFileSize = this._randomFileSize();
        const randomFileType = this._randomFileIcon();
        let fileName: string = "filenamebla";
        fileName =
          fileName.charAt(0).toUpperCase() +
          fileName.slice(1).concat(`.${randomFileType.docType}`);

        _items.push({
          name: fileName,
          value: fileName,
          iconName: randomFileType.url,
          dateModified: randomDate.dateFormatted,
          dateModifiedValue: randomDate.value,
          fileSize: randomFileSize.value,
          fileSizeRaw: randomFileSize.rawSize,
          link: "https://google.com"
        });
      }
      _items = this._sortItems(_items, "dateModifiedValue", true);
    }

    const _columns: IColumn[] = [
      {
        key: "column1",
        name: "File Type",
        headerClassName: "DetailsListExample-header--FileIcon",
        className: "DetailsListExample-cell--FileIcon",
        iconClassName: "DetailsListExample-Header-FileTypeIcon",
        iconName: "Page",
        isIconOnly: true,
        fieldName: "name",
        minWidth: 16,
        maxWidth: 16,
        onRender: (item: IDocument) => {
          return (
            <img
              src={item.iconName}
              className={"DetailsListExample-documentIconImage"}
            />
          );
        }
      },
      {
        key: "column2",
        name: "Name",
        fieldName: "name",
        minWidth: 210,
        maxWidth: 350,
        isRowHeader: true,
        isResizable: true,
        isSorted: true,
        isSortedDescending: false,
        onColumnClick: this._onColumnClick,
        data: "string",
        isPadded: true,
        onRender: (item: IDocument) => {
          return <a href={item.link}>{item.name}</a>;
        }
      },
      {
        key: "column3",
        name: "Date Modified",
        fieldName: "dateModifiedValue",
        minWidth: 70,
        maxWidth: 90,
        isResizable: true,
        onColumnClick: this._onColumnClick,
        data: "number",
        onRender: (item: IDocument) => {
          return <span>{item.dateModified}</span>;
        },
        isPadded: true
      },
      {
        key: "column4",
        name: "File Size",
        fieldName: "fileSizeRaw",
        minWidth: 70,
        maxWidth: 90,
        isResizable: true,
        isCollapsable: true,
        data: "number",
        onColumnClick: this._onColumnClick,
        onRender: (item: IDocument) => {
          return <span>{item.fileSize}</span>;
        }
      }
    ];

    this._selection = new Selection({
      onSelectionChanged: () => {
        this.setState({
          selectionDetails: this._getSelectionDetails(),
          isModalSelection: this._selection.isModal()
        });
      }
    });

    this.state = {
      items: _items,
      columns: _columns,
      selectionDetails: this._getSelectionDetails(),
      isModalSelection: this._selection.isModal(),
      isCompactMode: false
    };
  }

  public render(): React.ReactElement<IRecentDocumentsProps> {
    const { columns, isCompactMode, items, selectionDetails } = this.state;
    return (
      <div className={styles.recentDocuments}>
        <h1>Recent Documents</h1>
        <DetailsList
          items={items}
          compact={true}
          columns={columns}
          selectionMode={SelectionMode.none}
          setKey="set"
          layoutMode={DetailsListLayoutMode.justified}
          isHeaderVisible={true}
          selection={this._selection}
          selectionPreservedOnEmptyClick={true}
          onItemInvoked={this._onItemInvoked}
          enterModalSelectionOnTouch={true}
        />
      </div>
    );
  }

  public componentDidUpdate(
    previousProps: any,
    previousState: IRecentDocumentsState
  ) {
    if (previousState.isModalSelection !== this.state.isModalSelection) {
      this._selection.setModal(this.state.isModalSelection);
    }
  }

  @autobind
  private _onChangeModalSelection(checked: boolean): void {
    this.setState({ isModalSelection: checked });
  }

  @autobind
  private _onChangeText(text: any): void {
    this.setState({
      items: text
        ? _items.filter(i => i.name.toLowerCase().indexOf(text) > -1)
        : _items
    });
  }

  private _onItemInvoked(item: any): void {
    alert(`Item invoked: ${item.name}`);
  }

  private _randomDate(
    start: Date,
    end: Date
  ): { value: number; dateFormatted: string } {
    const date: Date = new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime())
    );
    const dateData = {
      value: date.valueOf(),
      dateFormatted: date.toLocaleDateString()
    };
    return dateData;
  }

  private _randomFileIcon(): { docType: string; url: string } {
    const docType: string =
      fileIcons[Math.floor(Math.random() * fileIcons.length) + 0].name;
    return {
      docType,
      url: `https://static2.sharepointonline.com/files/fabric/assets/brand-icons/document/svg/${docType}_16x1.svg`
    };
  }

  private _randomFileSize(): { value: string; rawSize: number } {
    const fileSize: number = Math.floor(Math.random() * 100) + 30;
    return {
      value: `${fileSize} KB`,
      rawSize: fileSize
    };
  }

  private _getSelectionDetails(): string {
    const selectionCount = this._selection.getSelectedCount();

    switch (selectionCount) {
      case 0:
        return "No items selected";
      case 1:
        return (
          "1 item selected: " + (this._selection.getSelection()[0] as any).name
        );
      default:
        return `${selectionCount} items selected`;
    }
  }

  @autobind
  private _onColumnClick(ev: React.MouseEvent<HTMLElement>, column: IColumn) {
    const { columns, items } = this.state;
    let newItems: IDocument[] = items.slice();
    const newColumns: IColumn[] = columns.slice();
    const currColumn: IColumn = newColumns.filter(
      (currCol: IColumn, idx: number) => {
        return column.key === currCol.key;
      }
    )[0];
    newColumns.forEach((newCol: IColumn) => {
      if (newCol === currColumn) {
        currColumn.isSortedDescending = !currColumn.isSortedDescending;
        currColumn.isSorted = true;
      } else {
        newCol.isSorted = false;
        newCol.isSortedDescending = true;
      }
    });
    newItems = this._sortItems(
      newItems,
      currColumn.fieldName,
      currColumn.isSortedDescending
    );
    this.setState({
      columns: newColumns,
      items: newItems
    });
  }

  @autobind
  private _sortItems(
    items: IDocument[],
    sortBy: string,
    descending = false
  ): IDocument[] {
    if (descending) {
      return items.sort((a: IDocument, b: IDocument) => {
        if (a[sortBy] < b[sortBy]) {
          return 1;
        }
        if (a[sortBy] > b[sortBy]) {
          return -1;
        }
        return 0;
      });
    } else {
      return items.sort((a: IDocument, b: IDocument) => {
        if (a[sortBy] < b[sortBy]) {
          return -1;
        }
        if (a[sortBy] > b[sortBy]) {
          return 1;
        }
        return 0;
      });
    }
  }
}
