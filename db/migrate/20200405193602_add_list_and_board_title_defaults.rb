class AddListAndBoardTitleDefaults < ActiveRecord::Migration[6.0]
  def change
    change_column_null :boards, :title, false, ''
    change_column_null :lists, :title, false, ''

    change_column_default :boards, :title, ''
    change_column_default :lists, :title, ''
  end
end
