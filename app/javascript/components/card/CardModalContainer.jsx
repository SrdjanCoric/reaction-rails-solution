import React from "react";
import { connect } from "react-redux";
import * as actions from "../../actions/CardActions";
import { createComment } from "../../actions/CommentActions";
import moment from "moment";
import * as commentSelectors from "../../selectors/CommentSelectors";
import CardModal from "./CardModal";
import Popover from "../shared/Popover";
import DueDateForm from "./DueDateForm";
import LabelsForm from "./LabelsForm";
import CopyCardFormContainer from "./CopyCardFormContainer";
import MoveCardFormContainer from "./MoveCardFormContainer";

const mapStateToProps = (state, ownProps) => {
  const cardId = ownProps.match.params.id;
  const card = state.cards.find(card => card._id === cardId);
  const list = state.lists.find(list => list._id === card.listId);
  const comments = commentSelectors.cardCommentsAndActions(
    state,
    cardId,
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  return {
    card,
    list,
    comments,
    user: state.user
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onFetchCard: token =>
      dispatch(actions.fetchCard(token, ownProps.match.params.id)),
    onUpdateCard: (token, id, attrs, callback) => {
      dispatch(actions.updateCard(token, id, attrs, callback));
    },
    onCreateComment: (token, cardId, comment, callback) =>
      dispatch(createComment(token, cardId, comment, callback)),
    onDeleteCard: (token, cardId, callback) => {
      dispatch(actions.deleteCard(token, cardId, callback));
    }
  };
};

class CardModalContainer extends React.Component {
  state = {
    title: "",
    card: undefined,
    popover: {
      visible: false,
      attachedTo: null,
      type: null
    }
  };

  componentDidMount() {
    let token = localStorage.getItem("jwtToken");
    this.props.onFetchCard(token, newCard => {
      this.updateCardInState(newCard);
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.card !== this.props.card) {
      this.updateCardInState(this.props.card);
    }
  }

  handleTitleChange = e => {
    this.setState({ [e.target.name]: e.target.value });
  };

  handleTitleBlur = e => {
    e.preventDefault();

    this.props.onUpdateCard(
      localStorage.getItem("jwtToken"),
      this.state.card._id,
      {
        title: this.state.title
      }
    );
  };

  updateCardInState = newCard => {
    this.setState({
      card: newCard,
      title: newCard.title
    });
  };

  handleToggleArchive = () => {
    this.props.onUpdateCard(
      localStorage.getItem("jwtToken"),
      this.props.card._id,
      {
        archived: !this.props.card.archived
      }
    );
  };

  handleToggleCompleted = e => {
    e.preventDefault();
    e.stopPropagation();
    this.props.onUpdateCard(
      localStorage.getItem("jwtToken"),
      this.props.card._id,
      {
        completed: !this.state.card.completed
      }
    );
  };

  handleShowPopover = (e, type) => {
    e.stopPropagation();

    this.setState({
      popover: {
        type,
        attachedTo: e.target,
        visible: true
      }
    });
  };

  handleClosePopover = e => {
    e.preventDefault();
    this.onClosePopover();
  };

  onClosePopover = () => {
    this.setState({
      popover: {
        type: null,
        attachedTo: null,
        visible: false
      }
    });
  };

  handleDueDateSubmit = e => {
    e.preventDefault();

    const date = e.target.querySelector(".datepicker-select-date input").value;
    const time = e.target.querySelector(".datepicker-select-time input").value;
    const dateTime = `${date} ${time}`;

    this.props.onUpdateCard(
      localStorage.getItem("jwtToken"),
      this.state.card._id,
      { dueDate: moment(dateTime, "M/D/YYYY h:mm A").toISOString() },
      () => {
        this.onClosePopover();
      }
    );
  };

  handleDueDateRemove = e => {
    e.preventDefault();
    this.props.onUpdateCard(
      localStorage.getItem("jwtToken"),
      this.state.card._id,
      { dueDate: null, completed: false },
      () => {
        this.onClosePopover();
      }
    );
  };

  handleToggleLabel = (e, label) => {
    const currentLabels = this.state.card.labels;
    let labels;

    if (currentLabels.indexOf(label) === -1) {
      labels = currentLabels.concat(label);
    } else {
      labels = currentLabels.filter(currentLabel => currentLabel !== label);
    }

    this.props.onUpdateCard(
      localStorage.getItem("jwtToken"),
      this.state.card._id,
      {
        labels
      }
    );
  };

  handleDeleteCard = e => {
    this.props.onDeleteCard(
      localStorage.getItem("jwtToken"),
      this.props.card._id
    );
  };

  popoverChildren() {
    const type = this.state.popover.type;
    const visible = this.state.popover.visible;
    if (visible && type) {
      switch (type) {
        case "due-date":
          return (
            <DueDateForm
              dueDate={this.state.card.dueDate}
              onClose={this.handleClosePopover}
              onSubmit={this.handleDueDateSubmit}
              onRemove={this.handleDueDateRemove}
            />
          );
        case "labels":
          return (
            <LabelsForm
              selectedLabels={this.state.card.labels}
              onClose={this.handleClosePopover}
              onClickLabel={this.handleToggleLabel}
            />
          );
        case "copy-card":
          return (
            <CopyCardFormContainer
              onClose={this.handleClosePopover}
              card={this.state.card}
            />
          );
        case "move-card":
          return (
            <MoveCardFormContainer
              onClose={this.handleClosePopover}
              card={this.state.card}
            />
          );
        default:
          return null;
      }
    }
  }

  render() {
    if (this.state.card && this.props.list) {
      return (
        <>
          <CardModal
            user={this.props.user}
            title={this.state.title}
            card={this.state.card}
            list={this.props.list}
            onTitleBlur={this.handleTitleBlur}
            onTitleChange={this.handleTitleChange}
            onUpdateCard={this.props.onUpdateCard}
            onToggleArchive={this.handleToggleArchive}
            onCreateComment={this.props.onCreateComment}
            comments={this.props.comments}
            onShowPopover={this.handleShowPopover}
            onToggleCompleted={this.handleToggleCompleted}
            onDeleteCard={this.handleDeleteCard}
          />
          <Popover {...this.state.popover}>{this.popoverChildren()}</Popover>
        </>
      );
    } else {
      return null;
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CardModalContainer);
